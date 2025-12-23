import express from "express";
import rateLimit from "express-rate-limit";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// Thêm rate limiting để chống spam
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 20, // Giới hạn mỗi user 20 reviews mỗi giờ
  message: { error: "Bạn đã gửi quá nhiều đánh giá. Vui lòng thử lại sau 1 giờ." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tạo đánh giá sản phẩm
router.post("/", authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ID_San_pham, Diem_so, Noi_dung_binh_luan } = req.body;

    if (!ID_San_pham || !Diem_so) {
      return errorResponse(res, "ID_San_pham và Diem_so là bắt buộc", 400);
    }

    if (Diem_so < 1 || Diem_so > 5) {
      return errorResponse(res, "Điểm số phải từ 1 đến 5", 400);
    }

    // Kiểm tra đã đánh giá chưa
    const [existing] = await pool.query(
      "SELECT * FROM danh_gia_phan_hoi WHERE ID_Khach_hang = ? AND ID_San_pham = ?",
      [userId, ID_San_pham]
    );

    if (existing.length > 0) {
      return errorResponse(res, "Bạn đã đánh giá sản phẩm này rồi", 400);
    }

    // Kiểm tra đã mua sản phẩm chưa
    const [purchased] = await pool.query(
      `SELECT * FROM chi_tiet_don_hang ct
       JOIN don_hang dh ON ct.ID_Don_hang = dh.ID_Don_hang
       WHERE dh.ID_Khach_hang = ? AND ct.ID_San_pham = ? AND dh.Trang_thai IN ('delivered', 'completed')`,
      [userId, ID_San_pham]
    );

    if (purchased.length === 0) {
      return errorResponse(res, "Bạn cần mua sản phẩm trước khi đánh giá", 403);
    }

    await pool.query(
      'INSERT INTO danh_gia_phan_hoi (ID_San_pham, ID_Khach_hang, Diem_so, Noi_dung_binh_luan, Trang_thai) VALUES (?, ?, ?, ?, "approved")',
      [ID_San_pham, userId, Diem_so, Noi_dung_binh_luan || null]
    );

    return successResponse(res, { message: "Đánh giá thành công" }, {}, 201);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Create review error:", error);
    }
    return errorResponse(res, "Lỗi tạo đánh giá", 500);
  }
});

// Lấy đánh giá của sản phẩm
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [reviews] = await pool.query(
      `SELECT 
        dg.*,
        kh.Ten_khach_hang
      FROM danh_gia_phan_hoi dg
      JOIN khach_hang kh ON dg.ID_Khach_hang = kh.ID_Khach_hang
      WHERE dg.ID_San_pham = ? AND dg.Trang_thai = 'approved'
      ORDER BY dg.Ngay_danh_gia DESC
      LIMIT ? OFFSET ?`,
      [id, Number(limit), offset]
    );

    const [stats] = await pool.query(
      `SELECT 
        AVG(Diem_so) as Diem_trung_binh,
        COUNT(*) as Tong_so_danh_gia,
        SUM(CASE WHEN Diem_so = 5 THEN 1 ELSE 0 END) as So_5_sao,
        SUM(CASE WHEN Diem_so = 4 THEN 1 ELSE 0 END) as So_4_sao,
        SUM(CASE WHEN Diem_so = 3 THEN 1 ELSE 0 END) as So_3_sao,
        SUM(CASE WHEN Diem_so = 2 THEN 1 ELSE 0 END) as So_2_sao,
        SUM(CASE WHEN Diem_so = 1 THEN 1 ELSE 0 END) as So_1_sao
      FROM danh_gia_phan_hoi
      WHERE ID_San_pham = ? AND Trang_thai = 'approved'`,
      [id]
    );

    return successResponse(res, {
      reviews,
      stats: stats[0] || null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get reviews error:", error);
    }
    return errorResponse(res, "Lỗi lấy đánh giá", 500);
  }
});

export default router;
