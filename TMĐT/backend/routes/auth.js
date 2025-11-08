import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import crypto from 'crypto';

const router = express.Router();

// Store OTPs temporarily (trong production nên dùng Redis)
const otpStore = new Map();

// Tạo và gửi OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { Email } = req.body;

    if (!Email) {
      return res.status(400).json({ error: 'Email là bắt buộc' });
    }

    // Kiểm tra email có tồn tại không
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Email FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Email chưa được đăng ký' });
    }

    // Tạo OTP 6 số
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    // Lưu OTP
    otpStore.set(Email, { otp, expiresAt });

    // Gửi email OTP
    const emailResult = await sendOTP(Email, otp);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Không thể gửi email OTP' });
    }

    res.json({
      message: 'Mã OTP đã được gửi đến email của bạn',
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Lỗi gửi OTP' });
  }
});

// Đăng nhập bằng OTP
router.post('/login-otp', async (req, res) => {
  try {
    const { Email, otp } = req.body;

    if (!Email || !otp) {
      return res.status(400).json({ error: 'Email và OTP là bắt buộc' });
    }

    // Kiểm tra OTP
    const stored = otpStore.get(Email);
    if (!stored) {
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(Email);
      return res.status(400).json({ error: 'OTP đã hết hạn' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'OTP không đúng' });
    }

    // OTP hợp lệ, xóa OTP và đăng nhập
    otpStore.delete(Email);

    // Lấy thông tin user
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Ten_khach_hang, Email, Trang_thai FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const user = users[0];

    if (user.Trang_thai !== 'active') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.ID_Khach_hang, email: user.Email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        ID_Khach_hang: user.ID_Khach_hang,
        Ten_khach_hang: user.Ten_khach_hang,
        Email: user.Email
      }
    });
  } catch (error) {
    console.error('Login OTP error:', error);
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
});

// Đăng ký khách hàng
router.post('/register', async (req, res) => {
  try {
    const { Ten_khach_hang, Email, Mat_khau, So_dien_thoai, Dia_chi_mac_dinh } = req.body;

    if (!Ten_khach_hang || !Email || !Mat_khau) {
      return res.status(400).json({ error: 'Tên, Email và Mật khẩu là bắt buộc' });
    }

    // Kiểm tra email đã tồn tại
    const [existing] = await pool.query(
      'SELECT ID_Khach_hang FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Hash mật khẩu
    const Mat_khau_hash = await bcrypt.hash(Mat_khau, 10);

    // Tạo khách hàng mới
    const [result] = await pool.query(
      `INSERT INTO khach_hang (Ten_khach_hang, Email, Mat_khau_hash, So_dien_thoai, Dia_chi_mac_dinh)
       VALUES (?, ?, ?, ?, ?)`,
      [Ten_khach_hang, Email, Mat_khau_hash, So_dien_thoai || null, Dia_chi_mac_dinh || null]
    );

    // Tạo giỏ hàng cho khách hàng mới
    await pool.query(
      'INSERT INTO gio_hang (ID_Khach_hang) VALUES (?)',
      [result.insertId]
    );

    // Tạo token
    const token = jwt.sign(
      { id: result.insertId, email: Email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        ID_Khach_hang: result.insertId,
        Ten_khach_hang,
        Email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi đăng ký' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { Email, Mat_khau } = req.body;

    if (!Email || !Mat_khau) {
      return res.status(400).json({ error: 'Email và Mật khẩu là bắt buộc' });
    }

    // Tìm khách hàng
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Ten_khach_hang, Email, Mat_khau_hash, Trang_thai FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const user = users[0];

    if (user.Trang_thai !== 'active') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // Kiểm tra mật khẩu
    const isValid = await bcrypt.compare(Mat_khau, user.Mat_khau_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.ID_Khach_hang, email: user.Email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        ID_Khach_hang: user.ID_Khach_hang,
        Ten_khach_hang: user.Ten_khach_hang,
        Email: user.Email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
});

// Lấy thông tin người dùng hiện tại
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Dia_chi_mac_dinh, Ngay_tao FROM khach_hang WHERE ID_Khach_hang = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
