import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Lấy tất cả sản phẩm (có phân trang và lọc)
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
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
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
    params.push(Number(limit), offset);

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

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách sản phẩm' });
  }
});

// Lấy chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin sản phẩm
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
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    // Lấy hình ảnh sản phẩm
    const [images] = await pool.query(
      'SELECT * FROM hinh_anh_san_pham WHERE ID_San_pham = ? ORDER BY Thu_tu ASC',
      [id]
    );

    // Lấy đánh giá
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

    res.json({
      product: products[0],
      images,
      reviews
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({ error: 'Lỗi lấy chi tiết sản phẩm' });
  }
});

export default router;

