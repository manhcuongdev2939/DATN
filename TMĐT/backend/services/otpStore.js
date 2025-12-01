import pool from '../db.js';

const OTP_TYPES = {
  LOGIN: 'login',
  REGISTER: 'register',
};

export const saveOtp = async ({ email, code, type = OTP_TYPES.LOGIN, ttlMinutes = 5 }) => {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await pool.query(
    `INSERT INTO otp_codes (Email, Otp_code, Type, Expires_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE Otp_code = VALUES(Otp_code), Expires_at = VALUES(Expires_at)`,
    [email, code, type, expiresAt]
  );
};

export const verifyOtp = async ({ email, code, type = OTP_TYPES.LOGIN }) => {
  const [rows] = await pool.query(
    'SELECT * FROM otp_codes WHERE Email = ? AND Type = ?',
    [email, type]
  );

  if (!rows.length) {
    return { valid: false, reason: 'OTP không tồn tại' };
  }

  const record = rows[0];
  if (record.Expires_at < new Date()) {
    await pool.query('DELETE FROM otp_codes WHERE Email = ? AND Type = ?', [email, type]);
    return { valid: false, reason: 'OTP đã hết hạn' };
  }

  if (record.Otp_code !== code) {
    return { valid: false, reason: 'OTP không đúng' };
  }

  await pool.query('DELETE FROM otp_codes WHERE Email = ? AND Type = ?', [email, type]);
  return { valid: true };
};

export { OTP_TYPES };

