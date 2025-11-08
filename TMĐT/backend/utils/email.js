import nodemailer from 'nodemailer';

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Kiểm tra cấu hình email khi khởi động
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('⚠️  Cảnh báo: SMTP_USER hoặc SMTP_PASS chưa được cấu hình. Tính năng gửi email sẽ không hoạt động.');
}

// Gửi email voucher chào mừng
export const sendWelcomeVoucher = async (email, voucherCode) => {
  try {
    const mailOptions = {
      from: `"Ecommerce Store" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🎉 Chào mừng bạn đến với Ecommerce Store!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Chào mừng bạn đến với Ecommerce Store!</h2>
          <p>Cảm ơn bạn đã đăng ký nhận thông tin từ chúng tôi.</p>
          <p>Để tri ân, chúng tôi tặng bạn mã voucher:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #2563eb; font-size: 24px; margin: 0;">${voucherCode}</h3>
          </div>
          <p>Mã voucher này giảm 10% cho đơn hàng đầu tiên của bạn.</p>
          <p>Hãy sử dụng mã này khi thanh toán để nhận được ưu đãi!</p>
          <p>Trân trọng,<br>Đội ngũ Ecommerce Store</p>
        </div>
      `,      
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Gửi mã OTP
export const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Ecommerce Store" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🔐 Mã xác thực đăng nhập',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Mã xác thực đăng nhập</h2>
          <p>Bạn đang thực hiện đăng nhập vào tài khoản Ecommerce Store.</p>
          <p>Mã xác thực của bạn là:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h3>
          </div>
          <p style="color: #ef4444; font-weight: bold;">⚠️ Lưu ý: Mã này chỉ có hiệu lực trong 5 phút.</p>
          <p>Nếu bạn không thực hiện đăng nhập, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br>Đội ngũ Ecommerce Store</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

export default transporter;

