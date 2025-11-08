-- ============================================
-- SEED DATA - Dữ liệu mẫu cho hệ thống
-- ============================================

-- 1. Thêm danh mục
INSERT INTO danh_muc (Ten_danh_muc, Mo_ta, Trang_thai) VALUES
('Điện thoại', 'Các sản phẩm điện thoại thông minh', 'active'),
('Laptop', 'Máy tính xách tay', 'active'),
('Tablet', 'Máy tính bảng', 'active'),
('Phụ kiện', 'Phụ kiện điện tử', 'active'),
('Đồng hồ thông minh', 'Smartwatch và đồng hồ thông minh', 'active');

-- 2. Thêm sản phẩm mẫu
INSERT INTO san_pham (Ten_san_pham, Mo_ta, Gia, Gia_goc, So_luong_ton_kho, ID_Danh_muc, Thumbnail, Trang_thai) VALUES
-- Điện thoại
('iPhone 15', 'iPhone 15 128GB - Màn hình 6.1 inch, Chip A16 Bionic', 22990000, 24990000, 50, 1, 'https://via.placeholder.com/300', 'active'),
('iPhone 15 Pro', 'iPhone 15 Pro 256GB - Titanium, Camera 48MP', 28990000, 30990000, 30, 1, 'https://via.placeholder.com/300', 'active'),
('Samsung Galaxy S24', 'Galaxy S24 256GB - Màn hình Dynamic AMOLED 2X', 19990000, 21990000, 40, 1, 'https://via.placeholder.com/300', 'active'),
('Samsung Galaxy S24 Ultra', 'Galaxy S24 Ultra 512GB - S Pen, Camera 200MP', 28990000, 30990000, 25, 1, 'https://via.placeholder.com/300', 'active'),
('Xiaomi 14', 'Xiaomi 14 256GB - Snapdragon 8 Gen 3', 15990000, 17990000, 60, 1, 'https://via.placeholder.com/300', 'active'),
('OPPO Find X7', 'OPPO Find X7 256GB - Camera Hasselblad', 18990000, 20990000, 35, 1, 'https://via.placeholder.com/300', 'active'),

-- Laptop
('MacBook Air M2', 'MacBook Air 13 inch M2 - 256GB SSD, 8GB RAM', 24990000, 26990000, 20, 2, 'https://via.placeholder.com/300', 'active'),
('MacBook Pro M3', 'MacBook Pro 14 inch M3 - 512GB SSD, 16GB RAM', 44990000, 47990000, 15, 2, 'https://via.placeholder.com/300', 'active'),
('Dell XPS 13', 'Dell XPS 13 - Intel Core i7, 16GB RAM, 512GB SSD', 28990000, 30990000, 18, 2, 'https://via.placeholder.com/300', 'active'),
('HP Spectre x360', 'HP Spectre x360 - Intel Core i7, 16GB RAM, 1TB SSD', 27990000, 29990000, 12, 2, 'https://via.placeholder.com/300', 'active'),
('Asus ZenBook 14', 'Asus ZenBook 14 - AMD Ryzen 7, 16GB RAM, 512GB SSD', 20990000, 22990000, 25, 2, 'https://via.placeholder.com/300', 'active'),
('Lenovo ThinkPad X1', 'Lenovo ThinkPad X1 Carbon - Intel Core i7, 16GB RAM', 31990000, 33990000, 10, 2, 'https://via.placeholder.com/300', 'active');

-- 3. Thêm hình ảnh sản phẩm
INSERT INTO hinh_anh_san_pham (ID_San_pham, URL_hinh_anh, Thu_tu) VALUES
(1, 'https://via.placeholder.com/800', 1),
(1, 'https://via.placeholder.com/800', 2),
(2, 'https://via.placeholder.com/800', 1),
(2, 'https://via.placeholder.com/800', 2),
(3, 'https://via.placeholder.com/800', 1),
(4, 'https://via.placeholder.com/800', 1),
(7, 'https://via.placeholder.com/800', 1),
(8, 'https://via.placeholder.com/800', 1);

-- 4. Thêm voucher mẫu
INSERT INTO voucher (Ma_voucher, Mo_ta, Loai_giam_gia, Gia_tri_giam, Gia_tri_toi_thieu, Gia_tri_toi_da, Ngay_bat_dau, Ngay_ket_thuc, So_luong_su_dung_con_lai, Trang_thai) VALUES
('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percent', 10, 100000, 500000, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 100, 'active'),
('FREESHIP', 'Miễn phí vận chuyển', 'fixed', 30000, 0, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 500, 'active'),
('SALE50K', 'Giảm 50.000đ cho đơn hàng từ 500.000đ', 'fixed', 50000, 500000, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 200, 'active'),
('VIP20', 'Giảm 20% cho khách hàng VIP', 'percent', 20, 1000000, 1000000, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), 50, 'active');

-- 5. Thêm admin mẫu (mật khẩu: admin123)
-- Lưu ý: Cần hash mật khẩu trước khi insert. Mật khẩu mặc định: admin123
INSERT INTO nguoi_dung_admin (Ten_dang_nhap, Mat_khau_hash, Ho_ten, Email, Vai_tro, Trang_thai) VALUES
('admin', '$2b$10$rQZ8K5K5K5K5K5K5K5K5K.5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Quản trị viên', 'admin@example.com', 'super_admin', 'active');

-- Lưu ý: Mật khẩu admin cần được hash bằng bcrypt trước khi insert vào database
-- Có thể chạy script Node.js để tạo hash hoặc sử dụng API đăng ký

