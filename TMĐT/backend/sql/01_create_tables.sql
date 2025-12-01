-- ============================================
-- E-COMMERCE DATABASE SCHEMA
-- Migration file: Tạo tất cả các bảng
-- ============================================

-- 1. Bảng danh mục (Category)
CREATE TABLE IF NOT EXISTS danh_muc (
    ID_Danh_muc INT PRIMARY KEY AUTO_INCREMENT,
    Ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
    Mo_ta TEXT,
    Hinh_anh VARCHAR(512),
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    Trang_thai ENUM('active', 'inactive') DEFAULT 'active',
    INDEX idx_ten_danh_muc (Ten_danh_muc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng khách hàng (Customer)
CREATE TABLE IF NOT EXISTS khach_hang (
    ID_Khach_hang INT PRIMARY KEY AUTO_INCREMENT,
    Ten_khach_hang VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Mat_khau_hash VARCHAR(255) NOT NULL,
    So_dien_thoai VARCHAR(20),
    Dia_chi_mac_dinh VARCHAR(255),
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    Trang_thai ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    INDEX idx_email (Email),
    INDEX idx_so_dien_thoai (So_dien_thoai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng sản phẩm (Product)
CREATE TABLE IF NOT EXISTS san_pham (
    ID_San_pham INT PRIMARY KEY AUTO_INCREMENT,
    Ten_san_pham VARCHAR(255) NOT NULL,
    Mo_ta TEXT,
    Gia DECIMAL(10,2) NOT NULL,
    Gia_goc DECIMAL(10,2),
    So_luong_ton_kho INT DEFAULT 0,
    ID_Danh_muc INT,
    ID_Cua_hang INT DEFAULT 1,
    Thumbnail VARCHAR(512),
    Trang_thai ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    Ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Danh_muc) REFERENCES danh_muc(ID_Danh_muc) ON DELETE SET NULL,
    INDEX idx_ten_san_pham (Ten_san_pham),
    INDEX idx_id_danh_muc (ID_Danh_muc),
    INDEX idx_gia (Gia),
    INDEX idx_trang_thai (Trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng hình ảnh sản phẩm (Product Images) - BỔ SUNG
CREATE TABLE IF NOT EXISTS hinh_anh_san_pham (
    ID_Hinh_anh INT PRIMARY KEY AUTO_INCREMENT,
    ID_San_pham INT NOT NULL,
    URL_hinh_anh VARCHAR(512) NOT NULL,
    Mo_ta VARCHAR(255),
    Thu_tu INT DEFAULT 0,
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_San_pham) REFERENCES san_pham(ID_San_pham) ON DELETE CASCADE,
    INDEX idx_id_san_pham (ID_San_pham)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng đánh giá sản phẩm (Product Review)
CREATE TABLE IF NOT EXISTS danh_gia_phan_hoi (
    ID_Danh_gia INT PRIMARY KEY AUTO_INCREMENT,
    ID_San_pham INT NOT NULL,
    ID_Khach_hang INT NOT NULL,
    Diem_so TINYINT NOT NULL CHECK (Diem_so >= 1 AND Diem_so <= 5),
    Noi_dung_binh_luan TEXT,
    Ngay_danh_gia DATETIME DEFAULT CURRENT_TIMESTAMP,
    Trang_thai ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (ID_San_pham) REFERENCES san_pham(ID_San_pham) ON DELETE CASCADE,
    FOREIGN KEY (ID_Khach_hang) REFERENCES khach_hang(ID_Khach_hang) ON DELETE CASCADE,
    UNIQUE KEY uq_khach_hang_san_pham (ID_Khach_hang, ID_San_pham),
    INDEX idx_id_san_pham (ID_San_pham),
    INDEX idx_diem_so (Diem_so)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng giỏ hàng (Shopping Cart)
CREATE TABLE IF NOT EXISTS gio_hang (
    ID_Gio_hang INT PRIMARY KEY AUTO_INCREMENT,
    ID_Khach_hang INT NOT NULL UNIQUE,
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    Ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Khach_hang) REFERENCES khach_hang(ID_Khach_hang) ON DELETE CASCADE,
    INDEX idx_id_khach_hang (ID_Khach_hang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng chi tiết giỏ hàng (Cart Detail)
CREATE TABLE IF NOT EXISTS chi_tiet_gio_hang (
    ID_Chi_tiet_GH INT PRIMARY KEY AUTO_INCREMENT,
    ID_Gio_hang INT NOT NULL,
    ID_San_pham INT NOT NULL,
    So_luong INT NOT NULL DEFAULT 1 CHECK (So_luong > 0),
    Gia_tai_thoi_diem_them DECIMAL(10,2) NOT NULL,
    Ngay_them DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Gio_hang) REFERENCES gio_hang(ID_Gio_hang) ON DELETE CASCADE,
    FOREIGN KEY (ID_San_pham) REFERENCES san_pham(ID_San_pham) ON DELETE CASCADE,
    UNIQUE KEY uq_gio_hang_san_pham (ID_Gio_hang, ID_San_pham),
    INDEX idx_id_gio_hang (ID_Gio_hang),
    INDEX idx_id_san_pham (ID_San_pham)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng địa chỉ giao hàng (Shipping Address) - BỔ SUNG
CREATE TABLE IF NOT EXISTS dia_chi_giao_hang (
    ID_Dia_chi INT PRIMARY KEY AUTO_INCREMENT,
    ID_Khach_hang INT NOT NULL,
    Ten_nguoi_nhan VARCHAR(100) NOT NULL,
    So_dien_thoai VARCHAR(20) NOT NULL,
    Dia_chi VARCHAR(255) NOT NULL,
    Phuong_Xa VARCHAR(100),
    Quan_Huyen VARCHAR(100),
    Tinh_Thanh VARCHAR(100) NOT NULL,
    Mac_dinh BOOLEAN DEFAULT FALSE,
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Khach_hang) REFERENCES khach_hang(ID_Khach_hang) ON DELETE CASCADE,
    INDEX idx_id_khach_hang (ID_Khach_hang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng voucher (Voucher)
CREATE TABLE IF NOT EXISTS voucher (
    ID_Voucher INT PRIMARY KEY AUTO_INCREMENT,
    Ma_voucher VARCHAR(50) NOT NULL UNIQUE,
    Mo_ta VARCHAR(255),
    Loai_giam_gia ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
    Gia_tri_giam DECIMAL(10,2) NOT NULL,
    Gia_tri_toi_thieu DECIMAL(10,2) DEFAULT 0 COMMENT 'Đơn hàng tối thiểu để áp dụng',
    Gia_tri_toi_da DECIMAL(10,2) COMMENT 'Giá trị giảm tối đa (cho loại percent)',
    Ngay_bat_dau DATE NOT NULL,
    Ngay_ket_thuc DATE NOT NULL,
    So_luong_su_dung_con_lai INT DEFAULT 0,
    Trang_thai ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ma_voucher (Ma_voucher),
    INDEX idx_trang_thai (Trang_thai),
    INDEX idx_ngay_ket_thuc (Ngay_ket_thuc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng đơn hàng (Order)
CREATE TABLE IF NOT EXISTS don_hang (
    ID_Don_hang INT PRIMARY KEY AUTO_INCREMENT,
    ID_Khach_hang INT NOT NULL,
    Ma_don_hang VARCHAR(50) NOT NULL UNIQUE,
    Ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP,
    Tong_tien DECIMAL(10,2) NOT NULL,
    Tien_giam_gia DECIMAL(10,2) DEFAULT 0,
    Phi_van_chuyen DECIMAL(10,2) DEFAULT 0,
    Thanh_tien DECIMAL(10,2) NOT NULL,
    Trang_thai ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
    Phuong_thuc_thanh_toan ENUM('cash', 'bank_transfer', 'credit_card', 'e_wallet') DEFAULT 'cash',
    ID_Dia_chi INT,
    ID_Voucher INT,
    Ghi_chu TEXT,
    FOREIGN KEY (ID_Khach_hang) REFERENCES khach_hang(ID_Khach_hang) ON DELETE RESTRICT,
    FOREIGN KEY (ID_Dia_chi) REFERENCES dia_chi_giao_hang(ID_Dia_chi) ON DELETE SET NULL,
    FOREIGN KEY (ID_Voucher) REFERENCES voucher(ID_Voucher) ON DELETE SET NULL,
    INDEX idx_id_khach_hang (ID_Khach_hang),
    INDEX idx_ma_don_hang (Ma_don_hang),
    INDEX idx_trang_thai (Trang_thai),
    INDEX idx_ngay_dat (Ngay_dat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng chi tiết đơn hàng (Order Detail)
CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
    ID_Don_hang INT NOT NULL,
    ID_San_pham INT NOT NULL,
    So_luong INT NOT NULL CHECK (So_luong > 0),
    Don_gia_luc_dat DECIMAL(10,2) NOT NULL,
    Thanh_tien DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (ID_Don_hang, ID_San_pham),
    FOREIGN KEY (ID_Don_hang) REFERENCES don_hang(ID_Don_hang) ON DELETE CASCADE,
    FOREIGN KEY (ID_San_pham) REFERENCES san_pham(ID_San_pham) ON DELETE RESTRICT,
    INDEX idx_id_san_pham (ID_San_pham)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng thanh toán (Payment) - BỔ SUNG
CREATE TABLE IF NOT EXISTS thanh_toan (
    ID_Thanh_toan INT PRIMARY KEY AUTO_INCREMENT,
    ID_Don_hang INT NOT NULL,
    So_tien DECIMAL(10,2) NOT NULL,
    Phuong_thuc ENUM('cash', 'bank_transfer', 'credit_card', 'e_wallet') NOT NULL,
    Trang_thai ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    Ma_giao_dich VARCHAR(100),
    Thong_tin_them TEXT,
    Ngay_thanh_toan DATETIME,
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Don_hang) REFERENCES don_hang(ID_Don_hang) ON DELETE CASCADE,
    INDEX idx_id_don_hang (ID_Don_hang),
    INDEX idx_trang_thai (Trang_thai),
    INDEX idx_ma_giao_dich (Ma_giao_dich)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng yêu thích (Wishlist) - BỔ SUNG
CREATE TABLE IF NOT EXISTS wishlist (
    ID_Wishlist INT PRIMARY KEY AUTO_INCREMENT,
    ID_Khach_hang INT NOT NULL,
    ID_San_pham INT NOT NULL,
    Ngay_them DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Khach_hang) REFERENCES khach_hang(ID_Khach_hang) ON DELETE CASCADE,
    FOREIGN KEY (ID_San_pham) REFERENCES san_pham(ID_San_pham) ON DELETE CASCADE,
    UNIQUE KEY uq_khach_hang_san_pham (ID_Khach_hang, ID_San_pham),
    INDEX idx_id_khach_hang (ID_Khach_hang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng thông báo (Notification) - BỔ SUNG
CREATE TABLE IF NOT EXISTS thong_bao (
    ID_Thong_bao INT PRIMARY KEY AUTO_INCREMENT,
    ID_Khach_hang INT,
    Tieu_de VARCHAR(255) NOT NULL,
    Noi_dung TEXT,
    Loai ENUM('order', 'promotion', 'system', 'review') DEFAULT 'system',
    Da_doc BOOLEAN DEFAULT FALSE,
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Khach_hang) REFERENCES khach_hang(ID_Khach_hang) ON DELETE CASCADE,
    INDEX idx_id_khach_hang (ID_Khach_hang),
    INDEX idx_da_doc (Da_doc),
    INDEX idx_ngay_tao (Ngay_tao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Bảng người dùng admin (Admin User)
CREATE TABLE IF NOT EXISTS nguoi_dung_admin (
    ID_Admin INT PRIMARY KEY AUTO_INCREMENT,
    Ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    Mat_khau_hash VARCHAR(255) NOT NULL,
    Ho_ten VARCHAR(100) NOT NULL,
    Email VARCHAR(100),
    Vai_tro ENUM('super_admin', 'product_manager', 'order_manager', 'content_manager') DEFAULT 'product_manager',
    Trang_thai ENUM('active', 'inactive') DEFAULT 'active',
    Ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ten_dang_nhap (Ten_dang_nhap),
    INDEX idx_vai_tro (Vai_tro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Bảng lưu OTP (OTP store)
CREATE TABLE IF NOT EXISTS otp_codes (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Email VARCHAR(100) NOT NULL,
    Otp_code VARCHAR(10) NOT NULL,
    Type ENUM('login', 'register') DEFAULT 'login',
    Expires_at DATETIME NOT NULL,
    Created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email_type (Email, Type),
    INDEX idx_expires_at (Expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

