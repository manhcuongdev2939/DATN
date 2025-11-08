import express from 'express';
import pool from '../db.js';
import { sendWelcomeVoucher } from '../utils/email.js';
import crypto from 'crypto';

const router = express.Router();

// Đăng ký nhận thông tin và gửi voucher
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc' });
    }

    // Tạo voucher chào mừng
    const voucherCode = `WELCOME${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const [voucherResult] = await pool.query(
      `INSERT INTO voucher 
       (Ma_voucher, Mo_ta, Loai_giam_gia, Gia_tri_giam, Gia_tri_toi_thieu, Gia_tri_toi_da, 
        Ngay_bat_dau, Ngay_ket_thuc, So_luong_su_dung_con_lai, Trang_thai)
       VALUES (?, 'Voucher chào mừng - Giảm 10% cho đơn hàng đầu tiên', 'percent', 10, 100000, 500000, 
               CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 'active')`,
      [voucherCode]
    );

    // Gửi email voucher
    const emailResult = await sendWelcomeVoucher(email, voucherCode);

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Vẫn trả về success nhưng log lỗi
    }

    res.json({
      message: 'Đăng ký thành công! Voucher đã được gửi đến email của bạn.',
      voucherCode: voucherCode, // Trả về để test (trong production có thể bỏ)
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: 'Lỗi đăng ký nhận thông tin' });
  }
});

export default router;

