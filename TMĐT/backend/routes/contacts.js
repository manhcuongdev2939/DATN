import express from 'express';
import transporter from '../utils/email.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: 'Email và nội dung là bắt buộc' });
    }

    const receiver = process.env.CONTACT_RECEIVER || process.env.SMTP_USER || '';
    const mailOptions = {
      from: `"Website Contact" <${process.env.SMTP_USER || 'no-reply@example.com'}>` ,
      to: receiver,
      subject: `Liên hệ từ website${name ? ` - ${name}` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p><strong>Tên:</strong> ${name || 'Không cung cấp'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nội dung:</strong></p>
          <div style="white-space: pre-wrap;">${message}</div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent:', info.messageId);
    res.json({ message: 'Gửi liên hệ thành công' });
  } catch (error) {
    console.error('Contact send error:', error);
    res.status(500).json({ error: 'Lỗi khi gửi liên hệ' });
  }
});

export default router;