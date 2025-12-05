-- ============================================
-- Create `news` table and seed sample articles
-- ============================================

CREATE TABLE IF NOT EXISTS news (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content LONGTEXT,
  thumbnail VARCHAR(512),
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('published','draft') DEFAULT 'published',
  INDEX idx_slug (slug),
  INDEX idx_published_at (published_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample seed data
INSERT INTO news (title, slug, excerpt, content, thumbnail, published_at, status) VALUES
('Mở bán laptop mới - Ưu đãi hấp dẫn', 'mo-ban-laptop-moi-uu-dai-hap-dan', 'Bộ sưu tập laptop mới đã có mặt tại cửa hàng với nhiều ưu đãi cho khách hàng đầu tiên.', 'Chi tiết về chương trình khuyến mãi, thông số kỹ thuật và hướng dẫn mua hàng.', 'https://via.placeholder.com/400x250.png?text=Laptop+Moi', NOW(), 'published'),
('Hướng dẫn bảo quản pin điện thoại', 'huong-dan-bao-quan-pin-dien-thoai', 'Một vài mẹo đơn giản giúp pin điện thoại của bạn bền hơn theo thời gian.', 'Nội dung đầy đủ về cách sạc, nhiệt độ bảo quản và các lưu ý khi sử dụng.', 'https://via.placeholder.com/400x250.png?text=Bao+Quan+Pin', DATE_SUB(NOW(), INTERVAL 10 DAY), 'published'),
('Sample Post 1', 'sample-1', 'This is a sample excerpt for the first post.', 'This is the full content for the first sample post.', 'https://via.placeholder.com/400x250.png?text=Sample+1', DATE_SUB(NOW(), INTERVAL 12 DAY), 'published'),
('Sample Post 2', 'sample-2', 'This is a sample excerpt for the second post.', 'This is the full content for the second sample post.', 'https://via.placeholder.com/400x250.png?text=Sample+2', DATE_SUB(NOW(), INTERVAL 15 DAY), 'published');
