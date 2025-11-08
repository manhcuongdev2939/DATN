import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lấy danh sách địa chỉ
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [addresses] = await pool.query(
      'SELECT * FROM dia_chi_giao_hang WHERE ID_Khach_hang = ? ORDER BY Mac_dinh DESC, Ngay_tao DESC',
      [userId]
    );

    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách địa chỉ' });
  }
});

// Thêm địa chỉ mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa, Quan_Huyen, Tinh_Thanh, Mac_dinh } = req.body;

    if (!Ten_nguoi_nhan || !So_dien_thoai || !Dia_chi || !Tinh_Thanh) {
      return res.status(400).json({ error: 'Thông tin địa chỉ không đầy đủ' });
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
    if (Mac_dinh) {
      await pool.query(
        'UPDATE dia_chi_giao_hang SET Mac_dinh = FALSE WHERE ID_Khach_hang = ?',
        [userId]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO dia_chi_giao_hang 
       (ID_Khach_hang, Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa, Quan_Huyen, Tinh_Thanh, Mac_dinh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa || null, Quan_Huyen || null, Tinh_Thanh, Mac_dinh || false]
    );

    res.status(201).json({
      message: 'Đã thêm địa chỉ',
      ID_Dia_chi: result.insertId
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Lỗi thêm địa chỉ' });
  }
});

// Cập nhật địa chỉ
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa, Quan_Huyen, Tinh_Thanh, Mac_dinh } = req.body;

    // Kiểm tra quyền sở hữu
    const [addresses] = await pool.query(
      'SELECT * FROM dia_chi_giao_hang WHERE ID_Dia_chi = ? AND ID_Khach_hang = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({ error: 'Địa chỉ không tồn tại' });
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
    if (Mac_dinh) {
      await pool.query(
        'UPDATE dia_chi_giao_hang SET Mac_dinh = FALSE WHERE ID_Khach_hang = ? AND ID_Dia_chi != ?',
        [userId, id]
      );
    }

    await pool.query(
      `UPDATE dia_chi_giao_hang 
       SET Ten_nguoi_nhan = ?, So_dien_thoai = ?, Dia_chi = ?, Phuong_Xa = ?, Quan_Huyen = ?, Tinh_Thanh = ?, Mac_dinh = ?
       WHERE ID_Dia_chi = ?`,
      [Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa, Quan_Huyen, Tinh_Thanh, Mac_dinh, id]
    );

    res.json({ message: 'Đã cập nhật địa chỉ' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Lỗi cập nhật địa chỉ' });
  }
});

// Xóa địa chỉ
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [addresses] = await pool.query(
      'SELECT * FROM dia_chi_giao_hang WHERE ID_Dia_chi = ? AND ID_Khach_hang = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({ error: 'Địa chỉ không tồn tại' });
    }

    await pool.query('DELETE FROM dia_chi_giao_hang WHERE ID_Dia_chi = ?', [id]);

    res.json({ message: 'Đã xóa địa chỉ' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Lỗi xóa địa chỉ' });
  }
});

export default router;

