import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import { validateBody, authSchemas } from '../middleware/requestValidator.js';
import { saveOtp, verifyOtp, OTP_TYPES } from '../services/otpStore.js';
import { errorResponse, successResponse } from '../utils/response.js';

const router = express.Router();

// Tạo và gửi OTP
router.post('/request-otp', validateBody(authSchemas.requestOtp), async (req, res, next) => {
  try {
    const { Email } = req.body;

    // Kiểm tra email có tồn tại không
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Email FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Email chưa được đăng ký', 404);
    }

    // Tạo OTP 6 số
    const otp = crypto.randomInt(100000, 999999).toString();

    // Lưu OTP vào database
    await saveOtp({ email: Email, code: otp, type: OTP_TYPES.LOGIN });

    // Gửi email OTP
    const emailResult = await sendOTP(Email, otp);

    if (!emailResult.success) {
      return errorResponse(res, 'Không thể gửi email OTP', 500);
    }

    return successResponse(res, { message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (error) {
    next(error);
  }
});
// Rate limiter for OTP endpoints (register/request OTP) — prevents abuse while keeping other auth routes responsive
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // allow up to 6 OTP requests per window per IP
  message: 'Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login-otp', validateBody(authSchemas.loginOtp), async (req, res, next) => {
  try {
    const { Email, otp } = req.body;

    const { valid, reason } = await verifyOtp({
      email: Email,
      code: otp,
      type: OTP_TYPES.LOGIN,
    });

    if (!valid) {
      return errorResponse(res, reason || 'OTP không hợp lệ', 400);
    }

    // Lấy thông tin user
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Ten_khach_hang, Email, Trang_thai FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Không tìm thấy tài khoản', 404);
    }

    const user = users[0];

    if (user.Trang_thai !== 'active') {
      return errorResponse(res, 'Tài khoản đã bị khóa', 403);
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.ID_Khach_hang, email: user.Email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse(res, {
      message: 'Đăng nhập thành công',
      token,
      user: {
        ID_Khach_hang: user.ID_Khach_hang,
        Ten_khach_hang: user.Ten_khach_hang,
        Email: user.Email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register-otp', otpLimiter, validateBody(authSchemas.registerOtp), async (req, res, next) => {
  try {
    const { Email } = req.body;

    // Kiểm tra email đã tồn tại
    const [existing] = await pool.query(
      'SELECT ID_Khach_hang FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (existing.length > 0) {
      return errorResponse(res, 'Email đã được sử dụng', 400);
    }

    // Tạo OTP 6 số
    const otp = crypto.randomInt(100000, 999999).toString();
    await saveOtp({ email: Email, code: otp, type: OTP_TYPES.REGISTER });

    // Gửi email OTP
    const emailResult = await sendOTP(Email, otp);

    if (!emailResult.success) {
      return errorResponse(res, 'Không thể gửi email OTP', 500);
    }

    return successResponse(res, { message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (error) {
    next(error);
  }
});

router.post('/register', validateBody(authSchemas.register), async (req, res, next) => {
  try {
    const { Ten_khach_hang, Email, Mat_khau, So_dien_thoai, Dia_chi_mac_dinh, otp } = req.body;

    // Kiểm tra email đã tồn tại
    const [existing] = await pool.query(
      'SELECT ID_Khach_hang FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (existing.length > 0) {
      return errorResponse(res, 'Email đã được sử dụng', 400);
    }

    const { valid, reason } = await verifyOtp({
      email: Email,
      code: otp,
      type: OTP_TYPES.REGISTER,
    });

    if (!valid) {
      return errorResponse(res, reason || 'OTP không hợp lệ hoặc đã hết hạn', 400);
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

    // Nếu user cung cấp địa chỉ mặc định khi đăng ký, lưu vào bảng dia_chi_giao_hang
    if (Dia_chi_mac_dinh) {
      try {
        await pool.query(
          `INSERT INTO dia_chi_giao_hang (ID_Khach_hang, Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Mac_dinh)
           VALUES (?, ?, ?, ?, ?)`,
          [result.insertId, Ten_khach_hang || null, So_dien_thoai || null, Dia_chi_mac_dinh, true]
        );
      } catch (e) {
        console.error('Save default address on register error:', e);
        // Không dừng quá trình đăng ký nếu lưu địa chỉ thất bại
      }
    }

    // Tạo token
    const token = jwt.sign(
      { id: result.insertId, email: Email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Lấy lại địa chỉ giao hàng nếu có để trả về cho frontend
    let savedAddresses = [];
    try {
      const [rows] = await pool.query(
        'SELECT * FROM dia_chi_giao_hang WHERE ID_Khach_hang = ?',
        [result.insertId]
      );
      savedAddresses = rows;
    } catch (e) {
      // ignore
    }

    return successResponse(
      res,
      {
        message: 'Đăng ký thành công',
        token,
        user: {
          ID_Khach_hang: result.insertId,
          Ten_khach_hang,
          Email,
          Dia_chi_mac_dinh: Dia_chi_mac_dinh || null,
          addresses: savedAddresses,
        },
      },
      {},
      201
    );
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateBody(authSchemas.login), async (req, res, next) => {
  try {
    const { Email, Mat_khau } = req.body;

    // Tìm khách hàng
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Ten_khach_hang, Email, Mat_khau_hash, Trang_thai FROM khach_hang WHERE Email = ?',
      [Email]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Email hoặc mật khẩu không đúng', 401);
    }

    const user = users[0];

    if (user.Trang_thai !== 'active') {
      return errorResponse(res, 'Tài khoản đã bị khóa', 403);
    }

    // Kiểm tra mật khẩu
    const isValid = await bcrypt.compare(Mat_khau, user.Mat_khau_hash);

    if (!isValid) {
      return errorResponse(res, 'Email hoặc mật khẩu không đúng', 401);
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.ID_Khach_hang, email: user.Email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse(res, {
      message: 'Đăng nhập thành công',
      token,
      user: {
        ID_Khach_hang: user.ID_Khach_hang,
        Ten_khach_hang: user.Ten_khach_hang,
        Email: user.Email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Token required', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.query(
      'SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Dia_chi_mac_dinh, Ngay_tao FROM khach_hang WHERE ID_Khach_hang = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user: users[0] });
  } catch (error) {
    return errorResponse(res, 'Invalid token', 401);
  }
});

export default router;