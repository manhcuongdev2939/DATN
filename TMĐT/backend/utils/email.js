import nodemailer from 'nodemailer';

let transport = null;

// Function to initialize and get the transport
const getTransport = async () => {
  if (transport) {
    return transport;
  }

  // If SMTP credentials are provided, use them
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465', // Typically true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Otherwise, create a test account with Ethereal
    console.warn('⚠️  Cảnh báo: SMTP_USER hoặc SMTP_PASS chưa được cấu hình. Sẽ dùng tài khoản thử (Ethereal).');
    const testAccount = await nodemailer.createTestAccount();
    transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return transport;
};


// Generic email sending function
const sendEmail = async (mailOptions) => {
  const mailTransport = await getTransport();
  const info = await mailTransport.sendMail(mailOptions);

  console.log('Email sent successfully. Message ID:', info.messageId);

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log('==============================================================');
    console.log(' HỆ THỐNG ĐANG DÙNG EMAIL THỬ NGHIỆM (ETHEREAL) ');
    console.log(`Xem trước email tại: ${preview}`);
    console.log('==============================================================');
  }
  return { success: true, preview, messageId: info.messageId };
};

// Gửi email voucher chào mừng
export const sendWelcomeVoucher = async (email, voucherCode) => {
  try {
    const mailOptions = {
      from: `"Ecommerce Store" <${process.env.SMTP_USER || 'noreply@ecommerce.com'}>`,
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
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Gửi mã OTP
export const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Ecommerce Store" <${process.env.SMTP_USER || 'noreply@ecommerce.com'}>`,
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
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Gửi email xác nhận đơn hàng
export const sendOrderConfirmation = async (email, orderData) => {
  try {
    const { Ma_don_hang, Thanh_tien, Dia_chi_giao_hang, cartItems } = orderData;
    const mailOptions = {
      from: `"Ecommerce Store" <${process.env.SMTP_USER || 'noreply@ecommerce.com'}>`,
      to: email,
      subject: `✔ Xác nhận đơn hàng #${Ma_don_hang}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Cảm ơn bạn đã đặt hàng!</h2>
          <p>Chào bạn,</p>
          <p>Đơn hàng <strong>#${Ma_don_hang}</strong> của bạn đã được xác nhận thành công.</p>
          
          <div style="margin: 20px 0;">
            <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Chi tiết đơn hàng</h3>
            ${cartItems.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <span>${item.Ten_san_pham} (x${item.So_luong})</span>
                <span>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.Gia * item.So_luong)}</span>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; font-size: 1.2em;">
              <span>Tổng cộng:</span>
              <span>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Thanh_tien)}</span>
            </div>
          </div>

          <div style="margin: 20px 0;">
             <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Địa chỉ giao hàng</h3>
             <p>${Dia_chi_giao_hang.Ten_nguoi_nhan}</p>
             <p>${Dia_chi_giao_hang.So_dien_thoai}</p>
             <p>${Dia_chi_giao_hang.Dia_chi_cu_the}, ${Dia_chi_giao_hang.Phuong_xa}, ${Dia_chi_giao_hang.Quan_huyen}, ${Dia_chi_giao_hang.Tinh_thanh}</p>
          </div>

          <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng bắt đầu được vận chuyển.</p>
          <p>Cảm ơn bạn đã tin tưởng và mua sắm tại Ecommerce Store!</p>
          <p>Trân trọng,<br>Đội ngũ Ecommerce Store</p>
        </div>
      `,
    };
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Gửi email liên hệ
export const sendContactEmail = async ({ name, email, message }) => {
  try {
    const receiver = process.env.CONTACT_RECEIVER || process.env.SMTP_USER;
    if (!receiver) {
      console.error('Lỗi: Không có người nhận email liên hệ được cấu hình. Vui lòng đặt biến môi trường CONTACT_RECEIVER hoặc SMTP_USER.');
      return { success: false, error: 'Missing contact email receiver configuration.' };
    }

    const mailOptions = {
      from: `"Website Contact" <${process.env.SMTP_USER || 'noreply@ecommerce.com'}>`,
      to: receiver,
      replyTo: email,
      subject: `📬 Liên hệ từ website: ${name || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb;">Thông tin liên hệ mới</h2>
          <p><strong>Tên:</strong> ${name || "Không cung cấp"}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>Nội dung:</strong></p>
          <div style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 4px;">${message}</div>
        </div>
      `,
    };
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error: error.message };
  }
};
