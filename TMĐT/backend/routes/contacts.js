import express from "express";
import rateLimit from "express-rate-limit";
import { sendContactEmail } from "../utils/email.js";
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

router.post("/", contactLimiter, validateBody(contactSchema), async (req, res) => {
  try {
    const result = await sendContactEmail(req.body);

    if (result.success) {
      res.json({ message: "Gửi liên hệ thành công" });
    } else {
      // Lỗi đã được log bên trong sendContactEmail, chỉ cần trả về lỗi cho client
      res.status(500).json({ error: "Lỗi khi gửi liên hệ" });
    }
  } catch (error) {
    console.error("Contact send route error:", error);
    res.status(500).json({ error: "Lỗi khi gửi liên hệ" });
  }
});

export default router;
