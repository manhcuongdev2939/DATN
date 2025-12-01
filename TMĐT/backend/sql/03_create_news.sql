-- ============================================
-- Create `news` table and seed sample articles
-- ============================================

CREATE TABLE IF NOT EXISTS news (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content LONGTEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('published','draft') DEFAULT 'published',
  INDEX idx_published_at (published_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample seed data
INSERT INTO news (title, excerpt, content, published_at, status) VALUES
('Mở bán laptop mới - Ưu đãi hấp dẫn', 'Bộ sưu tập laptop mới đã có mặt tại cửa hàng với nhiều ưu đãi cho khách hàng đầu tiên.', 'Chi tiết về chương trình khuyến mãi, thông số kỹ thuật và hướng dẫn mua hàng.', NOW()),
('Hướng dẫn bảo quản pin điện thoại', 'Một vài mẹo đơn giản giúp pin điện thoại của bạn bền hơn theo thời gian.', 'Nội dung đầy đủ về cách sạc, nhiệt độ bảo quản và các lưu ý khi sử dụng.', DATE_SUB(NOW(), INTERVAL 10 DAY));
