-- ============================================
-- Add Attempts column to otp_codes table
-- Migration file: Thêm cột Attempts để theo dõi số lần thử OTP
-- ============================================

ALTER TABLE otp_codes
ADD COLUMN Attempts INT DEFAULT 0 COMMENT 'Số lần thử OTP sai';

-- Update index if needed
ALTER TABLE otp_codes
ADD INDEX idx_attempts (Attempts);
