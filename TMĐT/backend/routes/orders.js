import express from "express";
import crypto from "crypto";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// --- Helper Functions ---

/**
 * Generates a more unique order code.
 * @param {number} userId - The user's ID.
 * @returns {string} A unique order code.
 */
const generateOrderCode = (userId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DH${timestamp}${userId}${randomString}`;
};

// --- Routes ---

// Tạo đơn hàng mới
router.post("/", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log("Transaction started");

    const userId = req.user.id;
    console.log("User ID:", userId);
    const {
      ID_Dia_chi,
      ID_Voucher,
      Phuong_thuc_thanh_toan = "cash",
      Ghi_chu,
    } = req.body;

    if (!ID_Dia_chi) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, "Vui lòng chọn địa chỉ giao hàng.", 400);
    }

    // Lấy thông tin địa chỉ để kiểm tra họ tên và số điện thoại
    const [addressRows] = await connection.query(
      "SELECT Ten_nguoi_nhan, So_dien_thoai FROM dia_chi_giao_hang WHERE ID_Dia_chi = ? AND ID_Khach_hang = ?",
      [ID_Dia_chi, userId]
    );

    if (addressRows.length === 0) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, "Địa chỉ giao hàng không hợp lệ.", 400);
    }

    const { Ten_nguoi_nhan, So_dien_thoai } = addressRows[0];

    if (!Ten_nguoi_nhan || Ten_nguoi_nhan.trim() === "") {
      await connection.rollback();
      connection.release();
      return errorResponse(res, "Tên người nhận không được để trống.", 400);
    }

    if (!So_dien_thoai || So_dien_thoai.trim() === "") {
      await connection.rollback();
      connection.release();
      return errorResponse(res, "Số điện thoại người nhận không được để trống.", 400);
    }



    const [carts] = await connection.query(
      "SELECT ID_Gio_hang FROM gio_hang WHERE ID_Khach_hang = ?",
      [userId]
    );
    if (carts.length === 0) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, "Giỏ hàng của bạn đang trống.", 400);
    }
    const cartId = carts[0].ID_Gio_hang;

    const [cartItems] = await connection.query(
      `SELECT 
         ct.ID_San_pham, ct.So_luong, ct.Gia_tai_thoi_diem_them,
         sp.Ten_san_pham, sp.So_luong_ton_kho, sp.Trang_thai
       FROM chi_tiet_gio_hang ct
       JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
       WHERE ct.ID_Gio_hang = ? FOR UPDATE`, // Lock rows for update
      [cartId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, "Giỏ hàng của bạn đang trống.", 400);
    }

    let Tong_tien = 0;
    for (const item of cartItems) {
      if (item.Trang_thai !== "active") {
        await connection.rollback();
        connection.release();
        return errorResponse(
          res,
          `Sản phẩm "${item.Ten_san_pham}" đã ngừng kinh doanh.`,
          400
        );
      }
      if (item.So_luong > item.So_luong_ton_kho) {
        await connection.rollback();
        connection.release();
        return errorResponse(
          res,
          `Sản phẩm "${item.Ten_san_pham}" không đủ số lượng tồn kho.`,
          400
        );
      }
      Tong_tien += parseFloat(item.Gia_tai_thoi_diem_them) * item.So_luong;
    }

    // Tính toán giảm giá từ voucher
    let Tien_giam_gia = 0;
    if (ID_Voucher) {
      const [vouchers] = await connection.query(
        'SELECT * FROM voucher WHERE ID_Voucher = ? AND Trang_thai = "active" AND Ngay_bat_dau <= CURDATE() AND Ngay_ket_thuc >= CURDATE() AND So_luong_su_dung_con_lai > 0 FOR UPDATE',
        [ID_Voucher]
      );

      if (vouchers.length > 0) {
        const voucher = vouchers[0];
        if (voucher.Loai_giam_gia === "percent") {
          Tien_giam_gia = (Tong_tien * voucher.Gia_tri_giam) / 100;
          if (
            voucher.Gia_tri_toi_da &&
            Tien_giam_gia > voucher.Gia_tri_toi_da
          ) {
            Tien_giam_gia = voucher.Gia_tri_toi_da;
          }
        } else {
          Tien_giam_gia = voucher.Gia_tri_giam;
        }
        Tien_giam_gia = Math.min(Tien_giam_gia, Tong_tien);
      } else {
        await connection.rollback();
        connection.release();
        return errorResponse(
          res,
          "Voucher không hợp lệ hoặc đã hết lượt sử dụng.",
          400
        );
      }

      // After consuming voucher in order creation, clear vouchers cache
      try {
        const { clearVouchersCache } = await import("./vouchers.js");
        clearVouchersCache();
      } catch (_) {}
    }

    // Tính phí vận chuyển (có thể thêm logic tính phí vận chuyển ở đây)
    const Phi_van_chuyen = 0; // Tạm thời set 0, có thể thêm logic tính phí sau

    // Tính tổng tiền thanh toán
    const Thanh_tien = Tong_tien - Tien_giam_gia + Phi_van_chuyen;

    // Tạo mã đơn hàng và ID đơn hàng
    const Ma_don_hang = generateOrderCode(userId);
    console.log("Creating order with code:", Ma_don_hang);

    // Map incoming payment method to DB-safe enum (avoid ENUM errors)
    const _allowedPaymentMethods = [
      "cash",
      "bank_transfer",
      "credit_card",
      "e_wallet",
    ];
    const dbPhuongThuc = _allowedPaymentMethods.includes(Phuong_thuc_thanh_toan)
      ? Phuong_thuc_thanh_toan
      : "e_wallet";

    console.log("Order data:", {
      userId,
      ID_Dia_chi,
      Tong_tien,
      Tien_giam_gia,
      Phi_van_chuyen,
      Thanh_tien,
      Phuong_thuc_thanh_toan: dbPhuongThuc,
      ID_Voucher,
    });

    const [orderResult] = await connection.query(
      "INSERT INTO don_hang (ID_Khach_hang, ID_Dia_chi, Ma_don_hang, Tong_tien, Tien_giam_gia, Phi_van_chuyen, Thanh_tien, Trang_thai, Phuong_thuc_thanh_toan, ID_Voucher, Ghi_chu) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
      [
        userId,
        ID_Dia_chi,
        Ma_don_hang,
        Tong_tien,
        Tien_giam_gia,
        Phi_van_chuyen,
        Thanh_tien,
        dbPhuongThuc,
        ID_Voucher || null,
        Ghi_chu || null,
      ]
    );
    const orderId = orderResult.insertId;
    console.log("Order created with ID:", orderId);

    // Xử lý từng sản phẩm trong giỏ hàng
    console.log("Processing cart items:", cartItems.length);
    for (const item of cartItems) {
      const thanhTienItem =
        parseFloat(item.Gia_tai_thoi_diem_them) * item.So_luong;
      console.log(
        `Processing item: ${item.Ten_san_pham}, quantity: ${item.So_luong}, price: ${item.Gia_tai_thoi_diem_them}`
      );

      // First, atomically update stock and check if successful
      const [updateResult] = await connection.query(
        "UPDATE san_pham SET So_luong_ton_kho = So_luong_ton_kho - ? WHERE ID_San_pham = ? AND So_luong_ton_kho >= ? AND Trang_thai = ?",
        [item.So_luong, item.ID_San_pham, item.So_luong, "active"]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return errorResponse(
          res,
          `Sản phẩm "${item.Ten_san_pham}" đã hết hàng hoặc không đủ số lượng.`,
          409
        );
      }

      // Only insert order detail after successful stock update
      await connection.query(
        "INSERT INTO chi_tiet_don_hang (ID_Don_hang, ID_San_pham, So_luong, Don_gia_luc_dat, Thanh_tien) VALUES (?, ?, ?, ?, ?)",
        [
          orderId,
          item.ID_San_pham,
          item.So_luong,
          item.Gia_tai_thoi_diem_them,
          thanhTienItem,
        ]
      );
    }
    console.log("All cart items processed");

    if (ID_Voucher) {
      const [voucherUpdateResult] = await connection.query(
        "UPDATE voucher SET So_luong_su_dung_con_lai = So_luong_su_dung_con_lai - 1 WHERE ID_Voucher = ? AND So_luong_su_dung_con_lai > 0",
        [ID_Voucher]
      );
      if (voucherUpdateResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return errorResponse(res, "Voucher đã được sử dụng hết.", 409);
      }
    }

    // Use dbPhuongThuc computed earlier for payment insert
    // 'unpaid' không có trong ENUM của cột Trang_thai, dùng 'processing' thay thế cho phương thức thanh toán điện tử
    const paymentStatus = dbPhuongThuc === "cash" ? "pending" : "processing";

    await connection.query(
      "INSERT INTO thanh_toan (ID_Don_hang, So_tien, Phuong_thuc, Trang_thai) VALUES (?, ?, ?, ?)",
      [orderId, Thanh_tien, dbPhuongThuc, paymentStatus]
    );

    await connection.query(
      "DELETE FROM chi_tiet_gio_hang WHERE ID_Gio_hang = ?",
      [cartId]
    );

    await connection.commit();

    // Fetch the created order to return complete order data (after commit, use new connection)
    const [createdOrders] = await pool.query(
      "SELECT * FROM don_hang WHERE ID_Don_hang = ?",
      [orderId]
    );

    connection.release();

    return successResponse(
      res,
      {
        message: "Đặt hàng thành công!",
        order: createdOrders[0] || {
          ID_Don_hang: orderId,
          Ma_don_hang,
          Thanh_tien,
        },
        orderId,
        orderCode: Ma_don_hang,
        total: Thanh_tien,
      },
      201
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Lỗi khi rollback:", rollbackError);
      }
      try {
        connection.release();
      } catch (releaseError) {
        console.error("Lỗi khi release connection:", releaseError);
      }
    }
    console.error("Lỗi khi tạo đơn hàng:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.sql) {
      console.error("SQL:", error.sql);
    }
    return errorResponse(
      res,
      error.message ||
        "Đã xảy ra lỗi trong quá trình tạo đơn hàng. Vui lòng thử lại.",
      500
    );
  }
});

// Lấy danh sách đơn hàng của khách hàng
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    let countSql =
      "SELECT COUNT(DISTINCT dh.ID_Don_hang) as total FROM don_hang dh WHERE dh.ID_Khach_hang = ?";
    const countParams = [userId];
    if (status) {
      countSql += " AND dh.Trang_thai = ?";
      countParams.push(status);
    }
    const [[{ total }]] = await pool.query(countSql, countParams);

    let sql = `
      SELECT 
        dh.ID_Don_hang, dh.Ma_don_hang, dh.Thanh_tien, dh.Trang_thai, dh.Ngay_dat,
        dh.Tong_tien, dh.Tien_giam_gia, dh.Phi_van_chuyen,
        COUNT(DISTINCT ct.ID_San_pham) as So_luong_san_pham,
        GROUP_CONCAT(ct.ID_San_pham) as ProductIds,
        (SELECT sp.Thumbnail FROM san_pham sp JOIN chi_tiet_don_hang ctdh ON sp.ID_San_pham = ctdh.ID_San_pham WHERE ctdh.ID_Don_hang = dh.ID_Don_hang LIMIT 1) as First_Product_Thumbnail
      FROM don_hang dh
      LEFT JOIN chi_tiet_don_hang ct ON dh.ID_Don_hang = ct.ID_Don_hang
      WHERE dh.ID_Khach_hang = ?
    `;
    const params = [userId];

    if (status) {
      sql += " AND dh.Trang_thai = ?";
      params.push(status);
    }

    sql +=
      " GROUP BY dh.ID_Don_hang ORDER BY dh.Ngay_dat DESC LIMIT ? OFFSET ?";
    params.push(safeLimit, offset);

    const [orders] = await pool.query(sql, params);

    return successResponse(
      res,
      { orders },
      {
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      }
    );
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng:", error);
    return errorResponse(res, "Không thể lấy danh sách đơn hàng.", 500);
  }
});

// Lấy chi tiết đơn hàng
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT dh.*, dc.*, v.Ma_voucher, v.Gia_tri_giam, v.Loai_giam_gia
       FROM don_hang dh
       LEFT JOIN dia_chi_giao_hang dc ON dh.ID_Dia_chi = dc.ID_Dia_chi
       LEFT JOIN voucher v ON dh.ID_Voucher = v.ID_Voucher
       WHERE dh.ID_Don_hang = ? AND dh.ID_Khach_hang = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return errorResponse(
        res,
        "Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.",
        404
      );
    }

    const [items] = await pool.query(
      `SELECT 
        ct.*,
        sp.Ten_san_pham,
        sp.Thumbnail
      FROM chi_tiet_don_hang ct
      JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
      WHERE ct.ID_Don_hang = ?`,
      [id]
    );

    const [payment] = await pool.query(
      "SELECT * FROM thanh_toan WHERE ID_Don_hang = ?",
      [id]
    );

    return successResponse(res, {
      order: orders[0],
      items,
      payment: payment.length > 0 ? payment[0] : null,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng:", error);
    return errorResponse(
      res,
      "Không thể lấy thông tin chi tiết đơn hàng.",
      500
    );
  }
});

export default router;
