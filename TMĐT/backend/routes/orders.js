import express from "express";
import crypto from "crypto";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { sendOrderConfirmation } from "../utils/email.js";

const router = express.Router();

/* =========================
   Helper
========================= */
const generateOrderCode = (userId) => {
  const ts = Date.now().toString().slice(-6); // 6 số cuối
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `DH${userId}${ts}${rand}`; // ~14–16 ký tự
};

/* =========================
   TẠO ĐƠN HÀNG
========================= */
router.post("/", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const userId = req.user.id;
    const {
      ID_Dia_chi,
      ID_Voucher,
      Phuong_thuc_thanh_toan = "cash",
      Ghi_chu,
    } = req.body;

    if (!ID_Dia_chi) {
      throw { status: 400, message: "Vui lòng chọn địa chỉ giao hàng." };
    }

    /* ---------- Địa chỉ ---------- */
    const [addresses] = await connection.query(
      "SELECT * FROM dia_chi_giao_hang WHERE ID_Dia_chi = ? AND ID_Khach_hang = ?",
      [ID_Dia_chi, userId]
    );
    if (addresses.length === 0) {
      throw { status: 400, message: "Địa chỉ giao hàng không hợp lệ." };
    }

    const Dia_chi_giao_hang = addresses[0];
    const phoneRegex = /^(0[3|5|7|8|9][0-9]{8})$/;
    if (
      !Dia_chi_giao_hang.Ten_nguoi_nhan ||
      !phoneRegex.test(Dia_chi_giao_hang.So_dien_thoai)
    ) {
      throw { status: 400, message: "Thông tin người nhận không hợp lệ." };
    }

    /* ---------- Giỏ hàng ---------- */
    const [[cart]] = await connection.query(
      "SELECT ID_Gio_hang FROM gio_hang WHERE ID_Khach_hang = ?",
      [userId]
    );
    if (!cart) {
      throw { status: 400, message: "Giỏ hàng không tồn tại." };
    }

    const [cartItems] = await connection.query(
      `SELECT ct.ID_San_pham, ct.So_luong, sp.Ten_san_pham,
              sp.So_luong_ton_kho, sp.Trang_thai, sp.Gia
       FROM chi_tiet_gio_hang ct
       JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
       WHERE ct.ID_Gio_hang = ? FOR UPDATE`,
      [cart.ID_Gio_hang]
    );

    if (cartItems.length === 0) {
      throw { status: 400, message: "Giỏ hàng trống." };
    }

    /* ---------- Tính tiền ---------- */
    let Tong_tien = 0;
    for (const item of cartItems) {
      if (
        item.Trang_thai !== "active" ||
        item.So_luong > item.So_luong_ton_kho
      ) {
        throw {
          status: 400,
          message: `Sản phẩm ${item.Ten_san_pham} không khả dụng.`,
        };
      }
      Tong_tien += Number(item.Gia) * item.So_luong;
    }

    let Tien_giam_gia = 0;
    if (ID_Voucher) {
      const [vouchers] = await connection.query(
        `SELECT * FROM voucher
         WHERE ID_Voucher = ?
         AND Trang_thai = 'active'
         AND Ngay_bat_dau <= CURDATE()
         AND Ngay_ket_thuc >= CURDATE()
         AND So_luong_su_dung_con_lai > 0
         FOR UPDATE`,
        [ID_Voucher]
      );
      if (vouchers.length === 0) {
        throw { status: 400, message: "Voucher không hợp lệ." };
      }

      const v = vouchers[0];
      Tien_giam_gia =
        v.Loai_giam_gia === "percent"
          ? Math.min(
              (Tong_tien * v.Gia_tri_giam) / 100,
              v.Gia_tri_toi_da || Infinity
            )
          : v.Gia_tri_giam;
    }

    const Phi_van_chuyen = Tong_tien >= 500000 ? 0 : 30000;
    const Thanh_tien = Tong_tien - Tien_giam_gia + Phi_van_chuyen;
    const Ma_don_hang = generateOrderCode(userId);

    /* ---------- Tạo đơn ---------- */
    const [orderResult] = await connection.query(
      `INSERT INTO don_hang
       (ID_Khach_hang, ID_Dia_chi, Ma_don_hang, Tong_tien,
        Tien_giam_gia, Phi_van_chuyen, Thanh_tien,
        Trang_thai, Phuong_thuc_thanh_toan, ID_Voucher, Ghi_chu)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        userId,
        ID_Dia_chi,
        Ma_don_hang,
        Tong_tien,
        Tien_giam_gia,
        Phi_van_chuyen,
        Thanh_tien,
        Phuong_thuc_thanh_toan,
        ID_Voucher || null,
        Ghi_chu || null,
      ]
    );

    const orderId = orderResult.insertId;

    /* ---------- Kho + chi tiết ---------- */
    for (const item of cartItems) {
      await connection.query(
        "UPDATE san_pham SET So_luong_ton_kho = So_luong_ton_kho - ? WHERE ID_San_pham = ?",
        [item.So_luong, item.ID_San_pham]
      );

      await connection.query(
        `
  INSERT INTO chi_tiet_don_hang
  (ID_Don_hang, ID_San_pham, So_luong, Don_gia_luc_dat, Thanh_tien)
  VALUES (?, ?, ?, ?, ?)
  `,
        [
          orderId,
          item.ID_San_pham,
          item.So_luong,
          item.Gia,
          item.So_luong * item.Gia,
        ]
      );
    }

    /* ---------- Thanh toán ---------- */
    const paymentStatus =
      Phuong_thuc_thanh_toan === "cash" ? "pending" : "processing";

    await connection.query(
      `INSERT INTO thanh_toan
       (ID_Don_hang, So_tien, Phuong_thuc, Trang_thai)
       VALUES (?, ?, ?, ?)`,
      [orderId, Thanh_tien, Phuong_thuc_thanh_toan, paymentStatus]
    );

    await connection.query(
      "DELETE FROM chi_tiet_gio_hang WHERE ID_Gio_hang = ?",
      [cart.ID_Gio_hang]
    );

    await connection.commit();
    connection.release();

    /* ---------- Email (ngoài transaction) ---------- */
    try {
      const [[user]] = await pool.query(
        "SELECT Email FROM khach_hang WHERE ID_Khach_hang = ?",
        [userId]
      );
      if (user?.Email) {
        await sendOrderConfirmation(user.Email, {
          Ma_don_hang,
          Thanh_tien,
          Dia_chi_giao_hang,
          cartItems,
        });
      }
    } catch (e) {
      console.error("Lỗi gửi email:", e);
    }

    return successResponse(res, {
      message: "Đặt hàng thành công",
      orderId,
      orderCode: Ma_don_hang,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    console.error("STACK:", err?.stack);
    console.error("BODY:", req.body);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
      try {
        connection.release();
      } catch (_) {}
    }

    return errorResponse(
      res,
      err.message || "Lỗi tạo đơn hàng.",
      err.status || 500
    );
  }
});

/* =========================
   LẤY DANH SÁCH ĐƠN HÀNG (CỦA USER)
========================= */
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("USER:", req.user);

    const userId = req.user.id;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const [orders] = await pool.query(
      `
  SELECT
    dh.ID_Don_hang,
    dh.Ma_don_hang,
    dh.Thanh_tien,
    dh.Trang_thai,
    dh.Ngay_dat,
    (
      SELECT COUNT(*)
      FROM chi_tiet_don_hang ctdh
      WHERE ctdh.ID_Don_hang = dh.ID_Don_hang
    ) AS So_luong_san_pham
  FROM don_hang dh
  WHERE dh.ID_Khach_hang = ?
  ORDER BY dh.Ngay_dat DESC
  LIMIT ? OFFSET ?
  `,
      [userId, limit, offset]
    );

    return successResponse(res, orders);
  } catch (err) {
    console.error("GET /orders ERROR:", err);
    return errorResponse(res, "Lỗi", 500);
  }
});

/* =========================
   LẤY CHI TIẾT ĐƠN HÀNG
========================= */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const [[order]] = await pool.query(
      `
      SELECT
  dh.ID_Don_hang,
  dh.Ma_don_hang,
  dh.Ngay_dat,
  dh.Tong_tien,
  dh.Tien_giam_gia,
  dh.Phi_van_chuyen,
  dh.Thanh_tien,
  dh.Trang_thai,
  dh.Phuong_thuc_thanh_toan,
  dh.Ghi_chu,

  dc.Ten_nguoi_nhan,
  dc.So_dien_thoai,
  dc.Dia_chi        AS Dia_chi_cu_the,
  dc.Phuong_Xa      AS Phuong_xa,
  dc.Quan_Huyen     AS Quan_huyen,
  dc.Tinh_Thanh     AS Tinh_thanh,

  tt.Phuong_thuc AS Phuong_thuc_thanh_toan_thuc_te,
  tt.Trang_thai  AS Trang_thai_thanh_toan,

  v.Ma_voucher
FROM don_hang dh
JOIN dia_chi_giao_hang dc ON dh.ID_Dia_chi = dc.ID_Dia_chi
LEFT JOIN thanh_toan tt ON dh.ID_Don_hang = tt.ID_Don_hang
LEFT JOIN voucher v ON dh.ID_Voucher = v.ID_Voucher
WHERE dh.ID_Don_hang = ?
  AND dh.ID_Khach_hang = ?
      `,
      [orderId, userId]
    );

    /* ✅ CHECK NGAY SAU QUERY */
    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
      });
    }

    /* ✅ LÚC NÀY order MỚI AN TOÀN */
    const [items] = await pool.query(
      `
     SELECT
  ct.So_luong,
  ct.Don_gia_luc_dat,
  sp.Ten_san_pham,
  sp.Thumbnail AS Hinh_anh
FROM chi_tiet_don_hang ct
JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
WHERE ct.ID_Don_hang = ?


      `,
      [order.ID_Don_hang]
    );

    order.items = items;
    return successResponse(res, order);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Lỗi khi lấy chi tiết đơn hàng.",
      err.status || 500
    );
  }
});

/* =========================
   HỦY ĐƠN HÀNG
========================= */
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const userId = req.user.id;
    const orderId = req.params.id;

    const [orders] = await connection.query(
      "SELECT * FROM don_hang WHERE ID_Don_hang = ? FOR UPDATE",
      [orderId]
    );
    if (orders.length === 0) {
      throw { status: 404, message: "Đơn hàng không tồn tại." };
    }

    const order = orders[0];
    if (order.ID_Khach_hang !== userId) {
      throw { status: 403, message: "Không có quyền hủy đơn." };
    }

    if (order.Trang_thai !== "pending") {
      throw {
        status: 400,
        message: "Chỉ có thể hủy đơn khi đang chờ xử lý.",
      };
    }

    await connection.query(
      "UPDATE don_hang SET Trang_thai = 'cancelled' WHERE ID_Don_hang = ?",
      [orderId]
    );

    const [items] = await connection.query(
      "SELECT ID_San_pham, So_luong FROM chi_tiet_don_hang WHERE ID_Don_hang = ?",
      [orderId]
    );

    for (const item of items) {
      await connection.query(
        "UPDATE san_pham SET So_luong_ton_kho = So_luong_ton_kho + ? WHERE ID_San_pham = ?",
        [item.So_luong, item.ID_San_pham]
      );
    }

    const [payments] = await connection.query(
      "SELECT Trang_thai FROM thanh_toan WHERE ID_Don_hang = ? FOR UPDATE",
      [orderId]
    );

    if (payments.length > 0) {
      const newStatus =
        payments[0].Trang_thai === "completed" ? "refunded" : "failed";
      await connection.query(
        "UPDATE thanh_toan SET Trang_thai = ? WHERE ID_Don_hang = ?",
        [newStatus, orderId]
      );
    }

    await connection.commit();
    connection.release();

    return successResponse(res, { message: "Hủy đơn hàng thành công." });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
      try {
        connection.release();
      } catch (_) {}
    }
    return errorResponse(
      res,
      err.message || "Lỗi hủy đơn hàng.",
      err.status || 500
    );
  }
});

export default router;
