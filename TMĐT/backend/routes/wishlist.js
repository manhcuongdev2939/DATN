import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lấy wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [items] = await pool.query(
      `SELECT 
        w.ID_Wishlist,
        w.Ngay_them,
        sp.ID_San_pham,
        sp.Ten_san_pham,
        sp.Gia,
        sp.Gia_goc,
        sp.Thumbnail,
        sp.Trang_thai
      FROM wishlist w
      JOIN san_pham sp ON w.ID_San_pham = sp.ID_San_pham
      WHERE w.ID_Khach_hang = ?
      ORDER BY w.Ngay_them DESC`,
      [userId]
    );

    res.json(items);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách yêu thích' });
  }
});

// Thêm vào wishlist
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ID_San_pham } = req.body;

    if (!ID_San_pham) {
      return res.status(400).json({ error: 'ID_San_pham là bắt buộc' });
    }

    // Kiểm tra sản phẩm
    const [products] = await pool.query(
      'SELECT * FROM san_pham WHERE ID_San_pham = ?',
      [ID_San_pham]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra đã có trong wishlist chưa
    const [existing] = await pool.query(
      'SELECT * FROM wishlist WHERE ID_Khach_hang = ? AND ID_San_pham = ?',
      [userId, ID_San_pham]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Sản phẩm đã có trong danh sách yêu thích' });
    }

    await pool.query(
      'INSERT INTO wishlist (ID_Khach_hang, ID_San_pham) VALUES (?, ?)',
      [userId, ID_San_pham]
    );

    res.json({ message: 'Đã thêm vào danh sách yêu thích' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Lỗi thêm vào danh sách yêu thích' });
  }
});

// Xóa khỏi wishlist
router.delete('/remove/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [items] = await pool.query(
      'SELECT * FROM wishlist WHERE ID_Wishlist = ? AND ID_Khach_hang = ?',
      [id, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy trong danh sách yêu thích' });
    }

    await pool.query('DELETE FROM wishlist WHERE ID_Wishlist = ?', [id]);

    res.json({ message: 'Đã xóa khỏi danh sách yêu thích' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Lỗi xóa khỏi danh sách yêu thích' });
  }
});

export default router;

