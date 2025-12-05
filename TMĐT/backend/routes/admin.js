import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { successResponse, errorResponse, buildPagination } from "../utils/response.js";

const router = express.Router();

// --- Auth ---
router.post("/login", async (req, res) => {
  const { Email, Mat_khau } = req.body;

  if (!Email || !Mat_khau) {
    return errorResponse(res, "Email và mật khẩu là bắt buộc", 400);
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM nguoi_dung_admin WHERE Email = ? LIMIT 1",
      [Email]
    );

    if (rows.length === 0) {
      return errorResponse(res, "Sai tài khoản hoặc mật khẩu", 401);
    }

    const admin = rows[0];

    if (admin.Trang_thai !== "active") {
      return errorResponse(res, "Tài khoản đã bị khóa", 403);
    }

    const match = await bcrypt.compare(Mat_khau, admin.Mat_khau_hash);
    if (!match) {
      return errorResponse(res, "Sai tài khoản hoặc mật khẩu", 401);
    }

    const token = jwt.sign(
      {
        id: admin.ID,
        username: admin.Ten_dang_nhap,
        role: admin.Vai_tro,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return successResponse(res, {
      token,
      user: {
        id: admin.ID,
        name: admin.Ho_ten,
        email: admin.Email,
        role: admin.Vai_tro,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return errorResponse(res, "Lỗi server nội bộ", 500);
  }
});

// --- Summary ---
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const [[{ users }]] = await pool.query("SELECT COUNT(*) as users FROM khach_hang");
    const [[{ products }]] = await pool.query("SELECT COUNT(*) as products FROM san_pham");
    const [[{ orders }]] = await pool.query("SELECT COUNT(*) as orders FROM don_hang");
    const [[{ revenue }]] = await pool.query("SELECT SUM(Tong_tien) as revenue FROM don_hang WHERE Trang_thai_thanh_toan = 'paid'");
    
    return successResponse(res, { summary: { users, products, orders, revenue } });
  } catch (error) {
    console.error("Get summary error:", error);
    return errorResponse(res, 'Lỗi lấy dữ liệu tổng quan');
  }
});


// --- User Management ---
router.get('/users', adminAuth, async (req, res) => {
  // Basic implementation
  try {
    const [users] = await pool.query("SELECT ID_Khach_hang, Ten_khach_hang, Email, Ngay_tao FROM khach_hang ORDER BY Ngay_tao DESC");
    return successResponse(res, { users });
  } catch(error) {
    return errorResponse(res, 'Lỗi lấy danh sách người dùng');
  }
});


// --- Order Management ---
router.get('/orders', adminAuth, async (req, res) => {
  // Basic implementation
  try {
    const [orders] = await pool.query("SELECT * FROM don_hang ORDER BY Ngay_dat_hang DESC");
    return successResponse(res, { orders });
  } catch(error) {
    return errorResponse(res, 'Lỗi lấy danh sách đơn hàng');
  }
});

// --- Product Management ---

// Get all products (for admin)
router.get('/products', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    let sql = `SELECT sp.*, dm.Ten_danh_muc 
               FROM san_pham sp 
               LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc`;
    const params = [];
    
    if (search) {
      sql += ' WHERE sp.Ten_san_pham LIKE ?';
      params.push(`%${search}%`);
    }
    
    sql += ` ORDER BY sp.Ngay_tao DESC LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const [products] = await pool.query(sql, params);
    
    let countSql = 'SELECT COUNT(*) as total FROM san_pham';
    const countParams = [];
    if (search) {
      countSql += ' WHERE Ten_san_pham LIKE ?';
      countParams.push(`%${search}%`);
    }
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;

    return successResponse(res, { products }, { pagination: buildPagination({ page: safePage, limit: safeLimit, total }) });
  } catch (error) {
    console.error('Admin get products error:', error);
    return errorResponse(res, 'Lỗi lấy danh sách sản phẩm');
  }
});

// Create a new product
router.post('/products', adminAuth, async (req, res) => {
  try {
    const {
      Ten_san_pham, Mo_ta, Gia, So_luong_ton_kho, ID_Danh_muc,
      Gia_goc = 0, Thumbnail = null, Trang_thai = 'active'
    } = req.body;

    if (!Ten_san_pham || !Gia || !So_luong_ton_kho || !ID_Danh_muc) {
      return errorResponse(res, 'Các trường bắt buộc không được để trống', 400);
    }

    const sql = `
      INSERT INTO san_pham (Ten_san_pham, Mo_ta, Gia, Gia_goc, So_luong_ton_kho, ID_Danh_muc, Thumbnail, Trang_thai)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      Ten_san_pham, Mo_ta, Gia, Gia_goc, So_luong_ton_kho, ID_Danh_muc, Thumbnail, Trang_thai
    ]);

    return successResponse(res, { id: result.insertId }, null, 201);
  } catch (error) {
    console.error('Admin create product error:', error);
    return errorResponse(res, 'Lỗi tạo sản phẩm mới');
  }
});

// Update a product
router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Ten_san_pham, Mo_ta, Gia, Gia_goc, So_luong_ton_kho, ID_Danh_muc, Thumbnail, Trang_thai
    } = req.body;

    if (!Ten_san_pham || !Gia || !So_luong_ton_kho || !ID_Danh_muc) {
      return errorResponse(res, 'Các trường bắt buộc không được để trống', 400);
    }
    
    const sql = `
      UPDATE san_pham SET
        Ten_san_pham = ?, Mo_ta = ?, Gia = ?, Gia_goc = ?, 
        So_luong_ton_kho = ?, ID_Danh_muc = ?, Thumbnail = ?, Trang_thai = ?
      WHERE ID_San_pham = ?
    `;
    const [result] = await pool.query(sql, [
      Ten_san_pham, Mo_ta, Gia, Gia_goc, So_luong_ton_kho,
      ID_Danh_muc, Thumbnail, Trang_thai, id
    ]);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Không tìm thấy sản phẩm để cập nhật', 404);
    }

    return successResponse(res, { message: 'Cập nhật sản phẩm thành công' });
  } catch (error) {
    console.error('Admin update product error:', error);
    return errorResponse(res, 'Lỗi cập nhật sản phẩm');
  }
});

// Delete a product (soft delete)
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "UPDATE san_pham SET Trang_thai = 'deleted' WHERE ID_San_pham = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Không tìm thấy sản phẩm để xóa', 404);
    }

    return successResponse(res, { message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return errorResponse(res, 'Lỗi xóa sản phẩm');
  }
});

export default router;
