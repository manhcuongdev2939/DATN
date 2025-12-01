import express from 'express';
import pool from '../db.js';
import { successResponse, errorResponse, buildPagination } from '../utils/response.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'Ngay_tao',
      order = 'DESC',
    } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;
    const params = [];
    let sql = `
      SELECT 
        sp.ID_San_pham,
        sp.Ten_san_pham,
        sp.Mo_ta,
        sp.Gia,
        sp.Gia_goc,
        sp.So_luong_ton_kho,
        sp.Thumbnail,
        sp.Trang_thai,
        dm.ID_Danh_muc,
        dm.Ten_danh_muc,
        (SELECT AVG(Diem_so) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as Diem_trung_binh,
        (SELECT COUNT(*) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as So_luong_danh_gia
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc
      WHERE sp.Trang_thai = 'active'
    `;

    if (category) {
      sql += ' AND sp.ID_Danh_muc = ?';
      params.push(category);
    }

    if (minPrice) {
      sql += ' AND sp.Gia >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      sql += ' AND sp.Gia <= ?';
      params.push(maxPrice);
    }

    if (search) {
      sql += ' AND (sp.Ten_san_pham LIKE ? OR sp.Mo_ta LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Validate sort và order
    const allowedSorts = ['Ngay_tao', 'Gia', 'Ten_san_pham', 'Diem_trung_binh'];
    const sortField = allowedSorts.includes(sort) ? sort : 'Ngay_tao';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY sp.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(Number(safeLimit), offset);

    const [products] = await pool.query(sql, params);

    // Đếm tổng số sản phẩm
    let countSql = 'SELECT COUNT(*) as total FROM san_pham WHERE Trang_thai = "active"';
    const countParams = [];
    
    if (category) {
      countSql += ' AND ID_Danh_muc = ?';
      countParams.push(category);
    }
    if (minPrice) {
      countSql += ' AND Gia >= ?';
      countParams.push(minPrice);
    }
    if (maxPrice) {
      countSql += ' AND Gia <= ?';
      countParams.push(maxPrice);
    }
    if (search) {
      countSql += ' AND (Ten_san_pham LIKE ? OR Mo_ta LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;

    return successResponse(
      res,
      { products },
      {
        pagination: buildPagination({ page: safePage, limit: safeLimit, total }),
      }
    );
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse(res, 'Lỗi lấy danh sách sản phẩm');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT 
        sp.*,
        dm.Ten_danh_muc,
        (SELECT AVG(Diem_so) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as Diem_trung_binh,
        (SELECT COUNT(*) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as So_luong_danh_gia
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc
      WHERE sp.ID_San_pham = ?`,
      [id]
    );

    if (products.length === 0) {
      return errorResponse(res, 'Sản phẩm không tồn tại', 404);
    }

    const [images] = await pool.query(
      'SELECT * FROM hinh_anh_san_pham WHERE ID_San_pham = ? ORDER BY Thu_tu ASC',
      [id]
    );

    const [reviews] = await pool.query(
      `SELECT 
        dg.*,
        kh.Ten_khach_hang
      FROM danh_gia_phan_hoi dg
      LEFT JOIN khach_hang kh ON dg.ID_Khach_hang = kh.ID_Khach_hang
      WHERE dg.ID_San_pham = ? AND dg.Trang_thai = 'approved'
      ORDER BY dg.Ngay_danh_gia DESC
      LIMIT 10`,
      [id]
    );

    return successResponse(res, {
      product: products[0],
      images,
      reviews,
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    return errorResponse(res, 'Lỗi lấy chi tiết sản phẩm');
  }
});

export default router;
