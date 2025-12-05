import express from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";
import { JWT_SECRET, authenticateToken } from "../middleware/auth.js";
import { sendOTP } from "../utils/email.js";
import { validateBody, authSchemas } from "../middleware/requestValidator.js";
import { saveOtp, verifyOtp, OTP_TYPES } from "../services/otpStore.js";
import { errorResponse, successResponse } from "../utils/response.js";

const router = express.Router();

// Rate limiter for login attempts (password-based)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: {
    error:
      "Quá nhiều lần thử đăng nhập từ IP này, vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP verification attempts
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP verification requests per window
  message: {
    error: "Quá nhiều lần thử xác thực OTP, vui lòng thử lại sau 10 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for requesting OTPs (prevents SMS/email bombing)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // allow up to 6 OTP requests per window per IP
  message: "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Tạo và gửi OTP
router.post(
  "/request-otp",
  otpLimiter,
  validateBody(authSchemas.requestOtp),
  async (req, res, next) => {
    try {
      const { Email } = req.body;

      // Kiểm tra email có tồn tại không
      const [users] = await pool.query(
        "SELECT ID_Khach_hang, Email FROM khach_hang WHERE Email = ?",
        [Email]
      );

      if (users.length > 0) {
        // User exists, proceed to send OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        await saveOtp({ email: Email, code: otp, type: OTP_TYPES.LOGIN });

        // We don't await this and don't check the result to prevent timing attacks
        sendOTP(Email, otp).catch((err) => {
          // Log the error but don't expose it to the client
          console.error(`Failed to send OTP for login to ${Email}:`, err);
        });
      }

      // Always return a generic success message to prevent user enumeration
      return successResponse(res, {
        message:
          "Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được mã OTP.",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login-otp",
  otpVerifyLimiter,
  validateBody(authSchemas.loginOtp),
  async (req, res, next) => {
    try {
      const { Email, otp } = req.body;

      const { valid, reason } = await verifyOtp({
        email: Email,
        code: otp,
        type: OTP_TYPES.LOGIN,
      });

      if (!valid) {
        return errorResponse(res, reason || "OTP không hợp lệ", 400);
      }

      // Lấy thông tin user
      const [users] = await pool.query(
        "SELECT ID_Khach_hang, Ten_khach_hang, Email, Trang_thai FROM khach_hang WHERE Email = ?",
        [Email]
      );

      if (users.length === 0) {
        return errorResponse(res, "Không tìm thấy tài khoản", 404);
      }

      const user = users[0];

      if (user.Trang_thai !== "active") {
        return errorResponse(res, "Tài khoản đã bị khóa", 403);
      }

      // Tạo token
      const token = jwt.sign(
        { id: user.ID_Khach_hang, email: user.Email, role: "customer" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return successResponse(res, {
        message: "Đăng nhập thành công",
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
  }
);

router.post(
  "/register-otp",
  otpLimiter,
  validateBody(authSchemas.registerOtp),
  async (req, res, next) => {
    try {
      const { Email } = req.body;

      // Kiểm tra email đã tồn tại
      const [existing] = await pool.query(
        "SELECT ID_Khach_hang FROM khach_hang WHERE Email = ?",
        [Email]
      );

      if (existing.length === 0) {
        // User does not exist, proceed to send OTP for registration
        const otp = crypto.randomInt(100000, 999999).toString();
        await saveOtp({ email: Email, code: otp, type: OTP_TYPES.REGISTER });

        // We don't await this and don't check the result to prevent timing attacks
        sendOTP(Email, otp).catch((err) => {
          // Log the error but don't expose it to the client
          console.error(
            `Failed to send OTP for registration to ${Email}:`,
            err
          );
        });
      }

      // Always return a generic success message to prevent user enumeration
      return successResponse(res, {
        message:
          "Nếu email của bạn hợp lệ và chưa được đăng ký, bạn sẽ nhận được mã OTP.",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/register",
  validateBody(authSchemas.register),
  async (req, res, next) => {
    try {
      const {
        Ten_khach_hang,
        Email,
        Mat_khau,
        So_dien_thoai,
        Dia_chi_mac_dinh,
        otp,
      } = req.body;

      // Kiểm tra email đã tồn tại
      const [existing] = await pool.query(
        "SELECT ID_Khach_hang FROM khach_hang WHERE Email = ?",
        [Email]
      );

      if (existing.length > 0) {
        return errorResponse(res, "Email đã được sử dụng", 400);
      }

      const { valid, reason } = await verifyOtp({
        email: Email,
        code: otp,
        type: OTP_TYPES.REGISTER,
      });

      if (!valid) {
        return errorResponse(
          res,
          reason || "OTP không hợp lệ hoặc đã hết hạn",
          400
        );
      }

      // Hash mật khẩu
      const Mat_khau_hash = await bcrypt.hash(Mat_khau, 10);

      // Tạo khách hàng mới
      const [result] = await pool.query(
        `INSERT INTO khach_hang (Ten_khach_hang, Email, Mat_khau_hash, So_dien_thoai, Dia_chi_mac_dinh)
       VALUES (?, ?, ?, ?, ?)`,
        [
          Ten_khach_hang,
          Email,
          Mat_khau_hash,
          So_dien_thoai || null,
          Dia_chi_mac_dinh || null,
        ]
      );

      // Tạo giỏ hàng cho khách hàng mới
      await pool.query("INSERT INTO gio_hang (ID_Khach_hang) VALUES (?)", [
        result.insertId,
      ]);

      // Nếu user cung cấp địa chỉ mặc định khi đăng ký, lưu vào bảng dia_chi_giao_hang
      if (Dia_chi_mac_dinh) {
        try {
          await pool.query(
            `INSERT INTO dia_chi_giao_hang (ID_Khach_hang, Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Mac_dinh)
           VALUES (?, ?, ?, ?, ?)`,
            [
              result.insertId,
              Ten_khach_hang || null,
              So_dien_thoai || null,
              Dia_chi_mac_dinh,
              true,
            ]
          );
        } catch (e) {
          console.error("Save default address on register error:", e);
          // Không dừng quá trình đăng ký nếu lưu địa chỉ thất bại
        }
      }

      // Tạo token
      const token = jwt.sign(
        { id: result.insertId, email: Email, role: "customer" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Lấy lại địa chỉ giao hàng nếu có để trả về cho frontend
      let savedAddresses = [];
      try {
        const [rows] = await pool.query(
          "SELECT * FROM dia_chi_giao_hang WHERE ID_Khach_hang = ?",
          [result.insertId]
        );
        savedAddresses = rows;
      } catch (e) {
        // ignore
      }

      return successResponse(
        res,
        {
          message: "Đăng ký thành công",
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
  }
);

router.post(
  "/login",
  loginLimiter,
  validateBody(authSchemas.login),
  async (req, res, next) => {
    try {
      const { Email, Mat_khau } = req.body;

      // Tìm khách hàng
      const [users] = await pool.query(
        "SELECT ID_Khach_hang, Ten_khach_hang, Email, Mat_khau_hash, Trang_thai FROM khach_hang WHERE Email = ? AND Trang_thai = 'active'",
        [Email]
      );

      if (users.length === 0) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      const user = users[0];

      // Kiểm tra mật khẩu
      const isValid = await bcrypt.compare(Mat_khau, user.Mat_khau_hash);

      if (!isValid) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      // Tạo token
      const token = jwt.sign(
        { id: user.ID_Khach_hang, email: user.Email, role: "customer" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return successResponse(res, {
        message: "Đăng nhập thành công",
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
  }
);

router.post(
  "/admin/login",
  loginLimiter,
  validateBody(authSchemas.login),
  async (req, res, next) => {
    console.log("Admin Login route received request. Body:", req.body); // Thêm log này
    try {
      const { Email, Mat_khau } = req.body;
      console.log("Admin Login Attempt:", {
        Email,
        Mat_khau_length: Mat_khau.length,
      }); // Log dữ liệu nhận được

      // Tìm quản trị viên trong bảng nguoi_dung_admin
      const [admins] = await pool.query(
        "SELECT ID_Admin, Ten_dang_nhap, Email, Mat_khau_hash, Vai_tro, Trang_thai FROM nguoi_dung_admin WHERE Email = ? AND Trang_thai = 'active'",
        [Email]
      );

      console.log("Admin query result:", admins); // Log kết quả truy vấn
      if (admins.length === 0) {
        // Luôn trả về lỗi chung để tránh dò thông tin người dùng
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      const adminUser = admins[0];
      console.log("Admin found:", adminUser.Email); // Log admin tìm thấy

      // Xác thực mật khẩu
      const isValid = await bcrypt.compare(Mat_khau, adminUser.Mat_khau_hash);
      console.log("Password comparison result:", isValid); // Log kết quả so sánh mật khẩu

      if (!isValid) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      // Tạo JWT token với vai trò (role) của admin
      const token = jwt.sign(
        {
          id: adminUser.ID_Admin,
          email: adminUser.Email,
          role: adminUser.Vai_tro || "admin",
        },
        JWT_SECRET,
        { expiresIn: "1d" } // Admin sessions có thể có thời gian ngắn hơn
      );

      return successResponse(res, {
        message: "Đăng nhập quản trị viên thành công",
        token,
        user: {
          ID_Admin: adminUser.ID_Admin,
          Ten_dang_nhap: adminUser.Ten_dang_nhap,
          Email: adminUser.Email,
          Vai_tro: adminUser.Vai_tro,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    // The user id is attached to req.user by the authenticateToken middleware
    const [users] = await pool.query(
      "SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Dia_chi_mac_dinh, Ngay_tao FROM khach_hang WHERE ID_Khach_hang = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      // This case should be rare if the token is valid and the user hasn't been deleted
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, { user: users[0] });
  } catch (error) {
    // Database errors or others will be caught here
    next(error);
  }
});

export default router;
