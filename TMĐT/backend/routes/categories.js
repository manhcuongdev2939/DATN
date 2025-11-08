import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Lấy tất cả danh mục
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT 
        dm.*,
        COUNT(sp.ID_San_pham) as So_luong_san_pham
      FROM danh_muc dm
      LEFT JOIN san_pham sp ON dm.ID_Danh_muc = sp.ID_Danh_muc AND sp.Trang_thai = 'active'
      WHERE dm.Trang_thai = 'active'
      GROUP BY dm.ID_Danh_muc
      ORDER BY dm.Ten_danh_muc ASC`
    );

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách danh mục' });
  }
});

// Lấy sản phẩm theo danh mục
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [products] = await pool.query(
      `SELECT 
        sp.*,
        (SELECT AVG(Diem_so) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as Diem_trung_binh
      FROM san_pham sp
      WHERE sp.ID_Danh_muc = ? AND sp.Trang_thai = 'active'
      ORDER BY sp.Ngay_tao DESC
      LIMIT ? OFFSET ?`,
      [id, Number(limit), offset]
    );

    res.json(products);
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ error: 'Lỗi lấy sản phẩm theo danh mục' });
  }
});

export default router;

