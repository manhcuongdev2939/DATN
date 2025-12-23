import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// Lấy danh sách địa chỉ
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [addresses] = await pool.query(
      "SELECT * FROM dia_chi_giao_hang WHERE ID_Khach_hang = ? ORDER BY Mac_dinh DESC, Ngay_tao DESC",
      [userId]
    );

    return successResponse(res, { addresses });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get addresses error:", error);
    }
    return errorResponse(res, "Lỗi lấy danh sách địa chỉ", 500);
  }
});

// Thêm địa chỉ mới
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      Ten_nguoi_nhan,
      So_dien_thoai,
      Dia_chi,
      Phuong_Xa,
      Quan_Huyen,
      Tinh_Thanh,
      Mac_dinh,
    } = req.body;

    if (!Ten_nguoi_nhan || !So_dien_thoai || !Dia_chi || !Tinh_Thanh) {
      return errorResponse(res, "Thông tin địa chỉ không đầy đủ", 400);
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
    if (Mac_dinh) {
      await pool.query(
        "UPDATE dia_chi_giao_hang SET Mac_dinh = FALSE WHERE ID_Khach_hang = ?",
        [userId]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO dia_chi_giao_hang 
       (ID_Khach_hang, Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa, Quan_Huyen, Tinh_Thanh, Mac_dinh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        Ten_nguoi_nhan,
        So_dien_thoai,
        Dia_chi,
        Phuong_Xa || null,
        Quan_Huyen || null,
        Tinh_Thanh,
        Mac_dinh || false,
      ]
    );

    return successResponse(
      res,
      {
        message: "Đã thêm địa chỉ",
        ID_Dia_chi: result.insertId,
      },
      {},
      201
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Add address error:", error);
    }
    return errorResponse(res, "Lỗi thêm địa chỉ", 500);
  }
});

// Cập nhật địa chỉ
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      Ten_nguoi_nhan,
      So_dien_thoai,
      Dia_chi,
      Phuong_Xa,
      Quan_Huyen,
      Tinh_Thanh,
      Mac_dinh,
    } = req.body;

    // Kiểm tra quyền sở hữu
    const [addresses] = await pool.query(
      "SELECT * FROM dia_chi_giao_hang WHERE ID_Dia_chi = ? AND ID_Khach_hang = ?",
      [id, userId]
    );

    if (addresses.length === 0) {
      return errorResponse(res, "Địa chỉ không tồn tại", 404);
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
    if (Mac_dinh) {
      await pool.query(
        "UPDATE dia_chi_giao_hang SET Mac_dinh = FALSE WHERE ID_Khach_hang = ? AND ID_Dia_chi != ?",
        [userId, id]
      );
    }

    await pool.query(
      `UPDATE dia_chi_giao_hang 
       SET Ten_nguoi_nhan = ?, So_dien_thoai = ?, Dia_chi = ?, Phuong_Xa = ?, Quan_Huyen = ?, Tinh_Thanh = ?, Mac_dinh = ?
       WHERE ID_Dia_chi = ?`,
      [
        Ten_nguoi_nhan,
        So_dien_thoai,
        Dia_chi,
        Phuong_Xa,
        Quan_Huyen,
        Tinh_Thanh,
        Mac_dinh,
        id,
      ]
    );

    return successResponse(res, { message: "Đã cập nhật địa chỉ" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Update address error:", error);
    }
    return errorResponse(res, "Lỗi cập nhật địa chỉ", 500);
  }
});

// Xóa địa chỉ
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [addresses] = await pool.query(
      "SELECT * FROM dia_chi_giao_hang WHERE ID_Dia_chi = ? AND ID_Khach_hang = ?",
      [id, userId]
    );

    if (addresses.length === 0) {
      return errorResponse(res, "Địa chỉ không tồn tại", 404);
    }

    await pool.query("DELETE FROM dia_chi_giao_hang WHERE ID_Dia_chi = ?", [
      id,
    ]);

    return successResponse(res, { message: "Đã xóa địa chỉ" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Delete address error:", error);
    }
    return errorResponse(res, "Lỗi xóa địa chỉ", 500);
  }
});

export default router;
