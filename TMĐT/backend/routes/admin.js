import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, requireAdmin, authenticateToken } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

// Admin login
router.post('/login', async (req, res, next) => {
  try {
    const { Ten_dang_nhap, Mat_khau } = req.body;

    const [rows] = await pool.query(
      'SELECT ID_Admin, Ten_dang_nhap, Mat_khau_hash, Ho_ten, Email, Vai_tro, Trang_thai FROM nguoi_dung_admin WHERE Ten_dang_nhap = ?',
      [Ten_dang_nhap]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Tên đăng nhập hoặc mật khẩu không đúng', 401);
    }

    const admin = rows[0];

    if (admin.Trang_thai !== 'active') {
      return errorResponse(res, 'Tài khoản admin đã bị khóa', 403);
    }

    const valid = await bcrypt.compare(Mat_khau, admin.Mat_khau_hash);
    if (!valid) {
      return errorResponse(res, 'Tên đăng nhập hoặc mật khẩu không đúng', 401);
    }

    const token = jwt.sign(
      { id: admin.ID_Admin, username: admin.Ten_dang_nhap, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse(res, { token, admin: { ID_Admin: admin.ID_Admin, Ten_dang_nhap: admin.Ten_dang_nhap, Ho_ten: admin.Ho_ten, Email: admin.Email, Vai_tro: admin.Vai_tro } });
  } catch (error) {
    next(error);
  }
});

// Middleware: authenticateToken already verifies JWT and sets req.user
// List customers
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(200, Number(limit) || 20);
    const offset = (safePage - 1) * safeLimit;

    let sql = 'SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Trang_thai, Ngay_tao FROM khach_hang';
    const params = [];
    if (search) {
      sql += ' WHERE Ten_khach_hang LIKE ? OR Email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY Ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(sql, params);
    const [countRes] = await pool.query('SELECT COUNT(*) as total FROM khach_hang');
    const total = countRes[0].total;

    return successResponse(res, { users: rows }, { pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } });
  } catch (error) {
    next(error);
  }
});

// List orders
router.get('/orders', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(200, Number(limit) || 20);
    const offset = (safePage - 1) * safeLimit;

    let sql = `SELECT dh.*, kh.Ten_khach_hang, kh.Email FROM don_hang dh LEFT JOIN khach_hang kh ON dh.ID_Khach_hang = kh.ID_Khach_hang`;
    const params = [];
    if (status) {
      sql += ' WHERE dh.Trang_thai = ?';
      params.push(status);
    }
    sql += ' ORDER BY dh.Ngay_dat DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(sql, params);
    const [countRes] = await pool.query('SELECT COUNT(*) as total FROM don_hang');
    const total = countRes[0].total;

    return successResponse(res, { orders: rows }, { pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } });
  } catch (error) {
    next(error);
  }
});

// List products (including inactive)
router.get('/products', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(200, Number(limit) || 20);
    const offset = (safePage - 1) * safeLimit;

    let sql = `SELECT sp.*, dm.Ten_danh_muc FROM san_pham sp LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc`;
    const params = [];
    if (search) {
      sql += ' WHERE sp.Ten_san_pham LIKE ? OR sp.Mo_ta LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY sp.Ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(sql, params);
    const [countRes] = await pool.query('SELECT COUNT(*) as total FROM san_pham');
    const total = countRes[0].total;

    return successResponse(res, { products: rows }, { pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } });
  } catch (error) {
    next(error);
  }
});

export default router;
