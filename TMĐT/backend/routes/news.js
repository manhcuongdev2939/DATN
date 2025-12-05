import express from 'express';
import pool from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

// GET: Lấy tất cả bài viết đã xuất bản
router.get('/', async (req, res, next) => {
  try {
    // Đã cập nhật để sử dụng bảng `tin_tuc` và lấy tất cả các trường cần thiết, bao gồm cả `Noi_dung`.
    // Giả định bạn có cột `Noi_dung` trong bảng `tin_tuc`.
    const [articles] = await pool.query(
      "SELECT ID_Bai_viet, Tieu_de, Slug, Mo_ta_ngan, Noi_dung, Thumbnail, Ngay_dang FROM tin_tuc WHERE Trang_thai = 'published' ORDER BY Ngay_dang DESC"
    );
    return successResponse(res, articles);
  } catch (error) {
    next(error);
  }
});

// GET: Lấy một bài viết theo ID hoặc Slug
router.get('/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;

    // Kiểm tra xem identifier là số (ID) hay chuỗi (Slug)
    const isNumericId = /^\d+$/.test(identifier);
    
    let query;
    let params;
    
    // Đã cập nhật để sử dụng các cột từ bảng `tin_tuc`
    const columns = 'ID_Bai_viet, Tieu_de, Slug, Mo_ta_ngan, Noi_dung, Thumbnail, Ngay_dang';

    if (isNumericId) {
      // Truy vấn bằng ID
      query = `SELECT ${columns} FROM tin_tuc WHERE ID_Bai_viet = ? AND Trang_thai = 'published'`;
      params = [parseInt(identifier, 10)];
    } else {
      // Truy vấn bằng Slug
      query = `SELECT ${columns} FROM tin_tuc WHERE Slug = ? AND Trang_thai = 'published'`;
      params = [identifier];
    }

    const [articles] = await pool.query(query, params);

    if (articles.length === 0) {
      return errorResponse(res, 'Bài viết không tồn tại', 404);
    }

    return successResponse(res, articles[0]);
  } catch (error) {
    next(error);
  }
});

export default router;