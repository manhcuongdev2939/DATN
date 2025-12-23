import express from "express";
import rateLimit from "express-rate-limit";
import transporter from "../utils/email.js";
import {
  validateBody,
  contactSchema,
} from "../middleware/requestValidator.js";

const router = express.Router();

// Thêm rate limiting để chống spam
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // Giới hạn mỗi IP 10 lần gửi mỗi giờ
  message: { error: "Bạn đã gửi quá nhiều liên hệ. Vui lòng thử lại sau 1 giờ." },
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Tích hợp CAPTCHA (ví dụ: hCaptcha/reCAPTCHA) vào tuyến này để ngăn chặn bot spam biểu mẫu liên hệ.
router.post("/", contactLimiter, validateBody(contactSchema), async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const receiver =
      process.env.CONTACT_RECEIVER || process.env.SMTP_USER || "";
    const mailOptions = {
      from: `"Website Contact" <${
        process.env.SMTP_USER || "no-reply@example.com"
      }>`,
      to: receiver,
      subject: `Liên hệ từ website${name ? ` - ${name}` : ""}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p><strong>Tên:</strong> ${name || "Không cung cấp"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nội dung:</strong></p>
          <div style="white-space: pre-wrap;">${message}</div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Contact email sent:", info.messageId);
    res.json({ message: "Gửi liên hệ thành công" });
  } catch (error) {
    console.error("Contact send error:", error);
    res.status(500).json({ error: "Lỗi khi gửi liên hệ" });
  }
});

export default router;
