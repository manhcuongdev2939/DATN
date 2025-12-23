import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// Lấy giỏ hàng của khách hàng
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy giỏ hàng
    const [carts] = await pool.query(
      "SELECT * FROM gio_hang WHERE ID_Khach_hang = ?",
      [userId]
    );

    if (carts.length === 0) {
      // Tạo giỏ hàng nếu chưa có
      await pool.query("INSERT INTO gio_hang (ID_Khach_hang) VALUES (?)", [
        userId,
      ]);
      return successResponse(res, { items: [], total: 0 });
    }

    const cartId = carts[0].ID_Gio_hang;

    // Lấy chi tiết giỏ hàng
    const [items] = await pool.query(
      `SELECT 
        ct.ID_Chi_tiet_GH,
        ct.ID_San_pham,
        ct.So_luong,
        ct.Gia_tai_thoi_diem_them,
        sp.Ten_san_pham,
        sp.Thumbnail,
        sp.So_luong_ton_kho,
        sp.Trang_thai,
        (ct.So_luong * ct.Gia_tai_thoi_diem_them) as Thanh_tien
      FROM chi_tiet_gio_hang ct
      JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
      WHERE ct.ID_Gio_hang = ?`,
      [cartId]
    );

    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.Thanh_tien),
      0
    );

    return successResponse(res, { items, total });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get cart error:", error);
    }
    return errorResponse(res, "Lỗi lấy giỏ hàng", 500);
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post("/add", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { ID_San_pham, So_luong = 1 } = req.body;

    if (!ID_San_pham) {
      await connection.rollback();
      return errorResponse(res, "ID_San_pham là bắt buộc", 400);
    }

    const quantity = parseInt(So_luong, 10);
    if (isNaN(quantity) || quantity < 1) {
      await connection.rollback();
      return errorResponse(res, "Số lượng phải là số nguyên lớn hơn 0", 400);
    }

    // Kiểm tra sản phẩm với lock
    const [products] = await connection.query(
      'SELECT * FROM san_pham WHERE ID_San_pham = ? AND Trang_thai = "active" FOR UPDATE',
      [ID_San_pham]
    );

    if (products.length === 0) {
      await connection.rollback();
      return errorResponse(res, "Sản phẩm không tồn tại", 404);
    }

    const product = products[0];

    if (product.So_luong_ton_kho < quantity) {
      await connection.rollback();
      return errorResponse(res, "Số lượng sản phẩm không đủ", 400);
    }

    // Lấy hoặc tạo giỏ hàng
    let [carts] = await connection.query(
      "SELECT ID_Gio_hang FROM gio_hang WHERE ID_Khach_hang = ? FOR UPDATE",
      [userId]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await connection.query(
        "INSERT INTO gio_hang (ID_Khach_hang) VALUES (?)",
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].ID_Gio_hang;
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const [existing] = await connection.query(
      "SELECT * FROM chi_tiet_gio_hang WHERE ID_Gio_hang = ? AND ID_San_pham = ? FOR UPDATE",
      [cartId, ID_San_pham]
    );

    if (existing.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existing[0].So_luong + quantity;
      if (newQuantity > product.So_luong_ton_kho) {
        await connection.rollback();
        return errorResponse(res, "Số lượng vượt quá tồn kho", 400);
      }

      await connection.query(
        "UPDATE chi_tiet_gio_hang SET So_luong = ?, Gia_tai_thoi_diem_them = ? WHERE ID_Chi_tiet_GH = ?",
        [newQuantity, product.Gia, existing[0].ID_Chi_tiet_GH]
      );
    } else {
      // Thêm mới
      await connection.query(
        "INSERT INTO chi_tiet_gio_hang (ID_Gio_hang, ID_San_pham, So_luong, Gia_tai_thoi_diem_them) VALUES (?, ?, ?, ?)",
        [cartId, ID_San_pham, quantity, product.Gia]
      );
    }

    await connection.commit();
    return successResponse(res, { message: "Đã thêm vào giỏ hàng" });
  } catch (error) {
    await connection.rollback();
    if (process.env.NODE_ENV === "development") {
      console.error("Add to cart error:", error);
    }
    return errorResponse(res, "Lỗi thêm vào giỏ hàng", 500);
  } finally {
    connection.release();
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put("/update/:id", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { id } = req.params;
    const { So_luong } = req.body;

    const quantity = parseInt(So_luong, 10);
    if (isNaN(quantity) || quantity < 1) {
      await connection.rollback();
      return errorResponse(res, "Số lượng phải là số nguyên lớn hơn 0", 400);
    }

    // Lấy thông tin chi tiết giỏ hàng với lock
    const [items] = await connection.query(
      `SELECT ct.*, sp.So_luong_ton_kho, sp.Trang_thai
       FROM chi_tiet_gio_hang ct
       JOIN gio_hang gh ON ct.ID_Gio_hang = gh.ID_Gio_hang
       JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
       WHERE ct.ID_Chi_tiet_GH = ? AND gh.ID_Khach_hang = ?
       FOR UPDATE`,
      [id, userId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return errorResponse(res, "Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    if (items[0].Trang_thai !== "active") {
      await connection.rollback();
      return errorResponse(res, "Sản phẩm đã ngừng kinh doanh", 400);
    }

    if (quantity > items[0].So_luong_ton_kho) {
      await connection.rollback();
      return errorResponse(res, "Số lượng vượt quá tồn kho", 400);
    }

    await connection.query(
      "UPDATE chi_tiet_gio_hang SET So_luong = ? WHERE ID_Chi_tiet_GH = ?",
      [quantity, id]
    );

    await connection.commit();
    return successResponse(res, { message: "Đã cập nhật giỏ hàng" });
  } catch (error) {
    await connection.rollback();
    if (process.env.NODE_ENV === "development") {
      console.error("Update cart error:", error);
    }
    return errorResponse(res, "Lỗi cập nhật giỏ hàng", 500);
  } finally {
    connection.release();
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete("/remove/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const [items] = await pool.query(
      `SELECT ct.* FROM chi_tiet_gio_hang ct
       JOIN gio_hang gh ON ct.ID_Gio_hang = gh.ID_Gio_hang
       WHERE ct.ID_Chi_tiet_GH = ? AND gh.ID_Khach_hang = ?`,
      [id, userId]
    );

    if (items.length === 0) {
      return errorResponse(res, "Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    await pool.query("DELETE FROM chi_tiet_gio_hang WHERE ID_Chi_tiet_GH = ?", [
      id,
    ]);

    return successResponse(res, { message: "Đã xóa khỏi giỏ hàng" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Remove from cart error:", error);
    }
    return errorResponse(res, "Lỗi xóa khỏi giỏ hàng", 500);
  }
});

export default router;
