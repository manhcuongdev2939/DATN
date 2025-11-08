import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lấy giỏ hàng của khách hàng
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy giỏ hàng
    const [carts] = await pool.query(
      'SELECT * FROM gio_hang WHERE ID_Khach_hang = ?',
      [userId]
    );

    if (carts.length === 0) {
      // Tạo giỏ hàng nếu chưa có
      await pool.query('INSERT INTO gio_hang (ID_Khach_hang) VALUES (?)', [userId]);
      return res.json({ items: [], total: 0 });
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

    const total = items.reduce((sum, item) => sum + parseFloat(item.Thanh_tien), 0);

    res.json({ items, total });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Lỗi lấy giỏ hàng' });
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ID_San_pham, So_luong = 1 } = req.body;

    if (!ID_San_pham) {
      return res.status(400).json({ error: 'ID_San_pham là bắt buộc' });
    }

    // Kiểm tra sản phẩm
    const [products] = await pool.query(
      'SELECT * FROM san_pham WHERE ID_San_pham = ? AND Trang_thai = "active"',
      [ID_San_pham]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const product = products[0];

    if (product.So_luong_ton_kho < So_luong) {
      return res.status(400).json({ error: 'Số lượng sản phẩm không đủ' });
    }

    // Lấy hoặc tạo giỏ hàng
    let [carts] = await pool.query(
      'SELECT ID_Gio_hang FROM gio_hang WHERE ID_Khach_hang = ?',
      [userId]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO gio_hang (ID_Khach_hang) VALUES (?)',
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].ID_Gio_hang;
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const [existing] = await pool.query(
      'SELECT * FROM chi_tiet_gio_hang WHERE ID_Gio_hang = ? AND ID_San_pham = ?',
      [cartId, ID_San_pham]
    );

    if (existing.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existing[0].So_luong + So_luong;
      if (newQuantity > product.So_luong_ton_kho) {
        return res.status(400).json({ error: 'Số lượng vượt quá tồn kho' });
      }

      await pool.query(
        'UPDATE chi_tiet_gio_hang SET So_luong = ?, Gia_tai_thoi_diem_them = ? WHERE ID_Chi_tiet_GH = ?',
        [newQuantity, product.Gia, existing[0].ID_Chi_tiet_GH]
      );
    } else {
      // Thêm mới
      await pool.query(
        'INSERT INTO chi_tiet_gio_hang (ID_Gio_hang, ID_San_pham, So_luong, Gia_tai_thoi_diem_them) VALUES (?, ?, ?, ?)',
        [cartId, ID_San_pham, So_luong, product.Gia]
      );
    }

    res.json({ message: 'Đã thêm vào giỏ hàng' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Lỗi thêm vào giỏ hàng' });
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { So_luong } = req.body;

    if (!So_luong || So_luong < 1) {
      return res.status(400).json({ error: 'Số lượng phải lớn hơn 0' });
    }

    // Lấy thông tin chi tiết giỏ hàng
    const [items] = await pool.query(
      `SELECT ct.*, sp.So_luong_ton_kho 
       FROM chi_tiet_gio_hang ct
       JOIN gio_hang gh ON ct.ID_Gio_hang = gh.ID_Gio_hang
       JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
       WHERE ct.ID_Chi_tiet_GH = ? AND gh.ID_Khach_hang = ?`,
      [id, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    if (So_luong > items[0].So_luong_ton_kho) {
      return res.status(400).json({ error: 'Số lượng vượt quá tồn kho' });
    }

    await pool.query(
      'UPDATE chi_tiet_gio_hang SET So_luong = ? WHERE ID_Chi_tiet_GH = ?',
      [So_luong, id]
    );

    res.json({ message: 'Đã cập nhật giỏ hàng' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Lỗi cập nhật giỏ hàng' });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:id', authenticateToken, async (req, res) => {
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
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    await pool.query('DELETE FROM chi_tiet_gio_hang WHERE ID_Chi_tiet_GH = ?', [id]);

    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Lỗi xóa khỏi giỏ hàng' });
  }
});

export default router;

