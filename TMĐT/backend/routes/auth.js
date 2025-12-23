import express from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Joi from "joi";
import pool from "../db.js";
import { JWT_SECRET, authenticateToken } from "../middleware/auth.js";
import { sendOTP } from "../utils/email.js";
import { validateBody, authSchemas } from "../middleware/requestValidator.js";
import { saveOtp, verifyOtp, OTP_TYPES } from "../services/otpStore.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { body, validationResult } from "express-validator";

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

// Rate limiter for registration attempts (prevents mass account creation)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: {
    error: "Quá nhiều lần thử đăng ký từ IP này, vui lòng thử lại sau 1 giờ.",
  },
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
        "SELECT ID_Khach_hang, Ten_khach_hang, Email, Trang_thai, Vai_tro FROM khach_hang WHERE Email = ?",
        [Email]
      );

      if (users.length === 0) {
        return errorResponse(res, "Không tìm thấy tài khoản", 404);
      }

      const user = users[0];

      if (user.Trang_thai !== "active") {
        return errorResponse(res, "Tài khoản đã bị khóa", 403);
      }

      // Tạo token (include jti)
      const jti = crypto.randomUUID
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");
      const token = jwt.sign(
        {
          id: user.ID_Khach_hang,
          email: user.Email,
          role: user.Vai_tro || "customer",
        },
        JWT_SECRET,
        { expiresIn: "7d", jwtid: jti }
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

// Xác thực mã OTP đăng ký (sử dụng store DB, không dùng biến memory)
router.post(
  "/verify-otp",
  validateBody(authSchemas.verifyRegisterOtp),
  async (req, res, next) => {
    try {
      const { Email, otp } = req.body;

      const { valid, reason } = await verifyOtp({
        email: Email,
        code: otp,
        type: OTP_TYPES.REGISTER,
        consume: false, // chỉ kiểm tra, không tiêu thụ; bước /register sẽ tiêu thụ
      });

      if (!valid) {
        return errorResponse(
          res,
          reason || "OTP không hợp lệ hoặc đã hết hạn",
          400
        );
      }

      return successResponse(res, { message: "Xác thực OTP thành công." });
    } catch (error) {
      next(error);
    }
  }
);

// Đăng ký người dùng mới
// TODO: Tích hợp CAPTCHA (ví dụ: hCaptcha/reCAPTCHA) vào tuyến này để ngăn chặn bot tạo tài khoản hàng loạt.
router.post(
  "/register",
  registerLimiter, // Apply rate limiting here
  validateBody(authSchemas.register),
  async (req, res, next) => {
    try {
      const {
        Ten_khach_hang,
        Email,
        Mat_khau,
        So_dien_thoai,
        Dia_chi_mac_dinh,
        Phuong_Xa,
        Quan_Huyen,
        Tinh_Thanh,
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
        consume: true, // tiêu thụ OTP khi đăng ký
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
            `INSERT INTO dia_chi_giao_hang (ID_Khach_hang, Ten_nguoi_nhan, So_dien_thoai, Dia_chi, Phuong_Xa, Quan_Huyen, Tinh_Thanh, Mac_dinh)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              result.insertId,
              Ten_khach_hang || null,
              So_dien_thoai || null,
              Dia_chi_mac_dinh,
              Phuong_Xa || null,
              Quan_Huyen || null,
              Tinh_Thanh || "Chưa cập nhật",
              true,
            ]
          );
        } catch (e) {
          console.error("Save default address on register error:", e);
          // Không dừng quá trình đăng ký nếu lưu địa chỉ thất bại
        }
      }

      // Tạo token (include jti for revocation support)
      const jti = crypto.randomUUID
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");

      // Fetch the role from the newly created user (defaults to 'customer' via migration)
      let userRole = "customer";
      try {
        const [created] = await pool.query(
          "SELECT Vai_tro FROM khach_hang WHERE ID_Khach_hang = ?",
          [result.insertId]
        );
        if (created && created[0] && created[0].Vai_tro) {
          userRole = created[0].Vai_tro;
        }
      } catch (e) {
        // ignore, fallback to 'customer'
      }

      const token = jwt.sign(
        { id: result.insertId, email: Email, role: userRole },
        JWT_SECRET,
        { expiresIn: "7d", jwtid: jti }
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

      // Tạo token (include jti)
      const jti = crypto.randomUUID
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");
      const token = jwt.sign(
        { id: user.ID_Khach_hang, email: user.Email, role: "customer" },
        JWT_SECRET,
        { expiresIn: "7d", jwtid: jti }
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
    try {
      const { Email, Mat_khau } = req.body;

      // Tìm quản trị viên trong bảng nguoi_dung_admin
      const [admins] = await pool.query(
        "SELECT ID_Admin, Ten_dang_nhap, Email, Mat_khau_hash, Vai_tro, Trang_thai FROM nguoi_dung_admin WHERE Email = ? AND Trang_thai = 'active'",
        [Email]
      );

      // Try authenticating in the traditional admin table first
      let adminUser = null;
      let adminSource = "nguoi_dung_admin";

      if (admins.length > 0) {
        const candidate = admins[0];
        const isValid = await bcrypt.compare(Mat_khau, candidate.Mat_khau_hash);
        if (isValid) {
          adminUser = candidate;
        }
      }

      // If not found or password invalid in admin table, try khach_hang with admin role
      if (!adminUser) {
        const [khachRows] = await pool.query(
          "SELECT ID_Khach_hang, Ten_khach_hang, Email, Mat_khau_hash, Vai_tro, Trang_thai FROM khach_hang WHERE Email = ? AND Trang_thai = 'active' AND Vai_tro IN ('admin','super_admin')",
          [Email]
        );
        if (khachRows.length > 0) {
          const candidate = khachRows[0];
          const isValidKhach = await bcrypt.compare(
            Mat_khau,
            candidate.Mat_khau_hash
          );
          if (isValidKhach) {
            adminUser = candidate;
            adminSource = "khach_hang";
          }
        }
      }

      // If still not authenticated, return generic error to avoid enumeration
      if (!adminUser) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      // Tạo JWT token với vai trò (role) của admin (admin hoặc super_admin)
      const adminRole =
        adminUser.Vai_tro === "super_admin" ? "super_admin" : "admin";
      const jti = crypto.randomUUID
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");

      const token = jwt.sign(
        {
          id:
            adminSource === "nguoi_dung_admin"
              ? adminUser.ID_Admin
              : adminUser.ID_Khach_hang,
          email: adminUser.Email,
          role: adminRole,
        },
        JWT_SECRET,
        { expiresIn: "1d", jwtid: jti } // Admin sessions có thể có thời gian ngắn hơn
      );

      const returnedUser =
        adminSource === "nguoi_dung_admin"
          ? {
              id: adminUser.ID_Admin,
              Ten_dang_nhap: adminUser.Ten_dang_nhap,
              Email: adminUser.Email,
              Vai_tro: adminUser.Vai_tro,
            }
          : {
              id: adminUser.ID_Khach_hang,
              Ten_khach_hang: adminUser.Ten_khach_hang,
              Email: adminUser.Email,
              Vai_tro: adminUser.Vai_tro,
              source: "khach_hang",
            };

      return successResponse(res, {
        message: "Đăng nhập quản trị viên thành công",
        token,
        user: returnedUser,
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
      "SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Dia_chi_mac_dinh, Ngay_tao, Vai_tro FROM khach_hang WHERE ID_Khach_hang = ?",
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

// Logout - revoke current JWT
router.post("/logout", authenticateToken, async (req, res, next) => {
  try {
    // Use the JWT id if present, otherwise use a hash of the raw token so older tokens can be revoked
    const rawToken =
      req.rawToken ||
      (req.headers &&
        req.headers.authorization &&
        req.headers.authorization.split(" ")[1]);
    const identifier =
      req.user?.jti ||
      (rawToken
        ? `raw:${crypto.createHash("sha256").update(rawToken).digest("hex")}`
        : null);

    if (!identifier) {
      return errorResponse(res, "Invalid token", 400);
    }

    // expires_at from token exp claim if present
    const expiresAt = req.user?.exp
      ? new Date(req.user.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await pool.query(
      "INSERT INTO revoked_tokens (jti, expires_at) VALUES (?, ?) ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)",
      [identifier, expiresAt]
    );

    return successResponse(res, { message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  validateBody(
    Joi.object({
      Ten_khach_hang: Joi.string().min(2).max(100).optional(),
      So_dien_thoai: Joi.string()
        .pattern(/^[0-9]{10,11}$/)
        .allow(null, "")
        .optional(),
      Dia_chi_mac_dinh: Joi.string().max(255).allow(null, "").optional(),
    }).min(1) // At least one field must be provided
  ),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const updates = {};

      if (req.body.Ten_khach_hang !== undefined) {
        updates.Ten_khach_hang = req.body.Ten_khach_hang;
      }
      if (req.body.So_dien_thoai !== undefined) {
        updates.So_dien_thoai = req.body.So_dien_thoai || null;
      }
      if (req.body.Dia_chi_mac_dinh !== undefined) {
        updates.Dia_chi_mac_dinh = req.body.Dia_chi_mac_dinh || null;
      }

      if (Object.keys(updates).length === 0) {
        return errorResponse(res, "Không có thông tin nào để cập nhật", 400);
      }

      const updateFields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const updateValues = Object.values(updates);
      updateValues.push(userId);

      await pool.query(
        `UPDATE khach_hang SET ${updateFields} WHERE ID_Khach_hang = ?`,
        updateValues
      );

      // Fetch updated user
      const [users] = await pool.query(
        "SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Dia_chi_mac_dinh, Ngay_tao FROM khach_hang WHERE ID_Khach_hang = ?",
        [userId]
      );

      return successResponse(res, {
        message: "Cập nhật thông tin thành công",
        user: users[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
