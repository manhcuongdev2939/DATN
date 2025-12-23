import express from "express";
import rateLimit from "express-rate-limit";
import pool from "../db.js";
import { sendWelcomeVoucher } from "../utils/email.js";
import { successResponse, errorResponse } from "../utils/response.js";
import crypto from "crypto";
import {
  validateBody,
  newsletterSchema,
} from "../middleware/requestValidator.js";

const router = express.Router();

// Tạm thời lưu trữ các email đã đăng ký trong bộ nhớ để tránh gửi voucher trùng lặp
// Trong ứng dụng thực tế, nên lưu trữ bền vững trong DB hoặc Redis
const subscribedEmails = new Set();

// Thêm rate limiting để chống spam
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Giới hạn mỗi IP 5 lần đăng ký mỗi giờ
  message: {
    error: "Bạn đã thực hiện quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 1 giờ.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Đăng ký nhận thông tin và gửi voucher
// TODO: Tích hợp CAPTCHA (ví dụ: hCaptcha/reCAPTCHA) vào tuyến này để ngăn chặn bot đăng ký hàng loạt.
router.post(
  "/subscribe",
  newsletterLimiter,
  validateBody(newsletterSchema),
  async (req, res) => {
    try {
      const { email } = req.body;

      // Kiểm tra xem email đã được đăng ký chưa
      if (subscribedEmails.has(email)) {
        return successResponse(res, {
          message: "Email của bạn đã được đăng ký nhận thông tin.",
        });
      }

      // Tạo voucher chào mừng
      const voucherCode = `WELCOME${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;
      const [voucherResult] = await pool.query(
        `INSERT INTO voucher 
         (Ma_voucher, Mo_ta, Loai_giam_gia, Gia_tri_giam, Gia_tri_toi_thieu, Gia_tri_toi_da, 
          Ngay_bat_dau, Ngay_ket_thuc, So_luong_su_dung_con_lai, Trang_thai)
         VALUES (?, 'Voucher chào mừng - Giảm 10% cho đơn hàng đầu tiên', 'percent', 10, 100000, 500000, 
                 CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 'active')`,
        [voucherCode]
      );

      // Thêm email vào danh sách đã đăng ký sau khi tạo voucher
      subscribedEmails.add(email);

    // Clear vouchers cache so public list refreshes
    try {
      const { clearVouchersCache } = await import("./vouchers.js");
      clearVouchersCache();
    } catch (_) {}

    // Gửi email voucher
    const emailResult = await sendWelcomeVoucher(email, voucherCode);

    if (!emailResult.success) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to send email:", emailResult.error);
      }
      // Vẫn trả về success nhưng log lỗi
    }

    return successResponse(res, {
      message: "Đăng ký thành công! Voucher đã được gửi đến email của bạn.",
      ...(process.env.NODE_ENV === "development" ? { voucherCode } : {}), // Chỉ trả về voucherCode trong development
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Newsletter subscribe error:", error);
    }
    return errorResponse(res, "Lỗi đăng ký nhận thông tin", 500);
  }
});

export default router;
