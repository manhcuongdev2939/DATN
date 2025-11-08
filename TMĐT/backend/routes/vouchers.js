import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Lấy danh sách voucher có sẵn
router.get('/', async (req, res) => {
  try {
    const [vouchers] = await pool.query(
      `SELECT * FROM voucher 
       WHERE Trang_thai = 'active' 
       AND Ngay_bat_dau <= CURDATE() 
       AND Ngay_ket_thuc >= CURDATE() 
       AND So_luong_su_dung_con_lai > 0
       ORDER BY Ngay_ket_thuc ASC`
    );

    res.json(vouchers);
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách voucher' });
  }
});

// Kiểm tra voucher
router.post('/check', async (req, res) => {
  try {
    const { Ma_voucher } = req.body;

    if (!Ma_voucher) {
      return res.status(400).json({ error: 'Mã voucher là bắt buộc' });
    }

    const [vouchers] = await pool.query(
      `SELECT * FROM voucher 
       WHERE Ma_voucher = ? 
       AND Trang_thai = 'active' 
       AND Ngay_bat_dau <= CURDATE() 
       AND Ngay_ket_thuc >= CURDATE() 
       AND So_luong_su_dung_con_lai > 0`,
      [Ma_voucher]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({ error: 'Voucher không hợp lệ hoặc đã hết hạn' });
    }

    res.json(vouchers[0]);
  } catch (error) {
    console.error('Check voucher error:', error);
    res.status(500).json({ error: 'Lỗi kiểm tra voucher' });
  }
});

export default router;

