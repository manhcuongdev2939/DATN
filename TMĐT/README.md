# Ecommerce (React + Tailwind + Node.js)

Hệ thống thương mại điện tử đầy đủ với các chức năng:
- Đăng ký/Đăng nhập khách hàng
- Quản lý sản phẩm và danh mục
- Giỏ hàng và đặt hàng
- Đánh giá sản phẩm
- Wishlist (Yêu thích)
- Quản lý địa chỉ giao hàng
- Voucher/Giảm giá
- Thanh toán


## Cài đặt

### 1. Backend

```bash
cd TMĐT/backend
npm install
```

### 2. Frontend

```bash
cd TMĐT/frontend
npm install
```

## Cấu hình Database

1. Tạo database MySQL:
```sql
CREATE DATABASE ecommerce;
```

2. Copy file `.env`:
```bash
cd TMĐT/backend
cp ENV_EXAMPLE.txt .env
```

3. Cập nhật thông tin database trong file `.env`

4. Chạy migration:
```sql
-- Chạy file: TMĐT/backend/sql/01_create_tables.sql
-- Sau đó chạy: TMĐT/backend/sql/02_seed_data.sql (nếu cần dữ liệu mẫu)
```

## Chạy ứng dụng

### Backend
```bash
cd TMĐT/backend
npm start
```
Backend sẽ chạy tại: http://localhost:3001

### Frontend
```bash
cd TMĐT/frontend
npm run dev
```
Frontend sẽ chạy tại: http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Products
- `GET /api/products` - Lấy danh sách sản phẩm (có phân trang, lọc, tìm kiếm)
- `GET /api/products/:id` - Lấy chi tiết sản phẩm

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/:id/products` - Lấy sản phẩm theo danh mục

### Cart (Yêu cầu đăng nhập)
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/add` - Thêm sản phẩm vào giỏ
- `PUT /api/cart/update/:id` - Cập nhật số lượng
- `DELETE /api/cart/remove/:id` - Xóa sản phẩm

### Orders (Yêu cầu đăng nhập)
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng

### Reviews (Yêu cầu đăng nhập để tạo)
- `POST /api/reviews` - Tạo đánh giá
- `GET /api/reviews/product/:id` - Lấy đánh giá của sản phẩm

### Wishlist (Yêu cầu đăng nhập)
- `GET /api/wishlist` - Lấy danh sách yêu thích
- `POST /api/wishlist/add` - Thêm vào yêu thích
- `DELETE /api/wishlist/remove/:id` - Xóa khỏi yêu thích

### Addresses (Yêu cầu đăng nhập)
- `GET /api/addresses` - Lấy danh sách địa chỉ
- `POST /api/addresses` - Thêm địa chỉ
- `PUT /api/addresses/:id` - Cập nhật địa chỉ
- `DELETE /api/addresses/:id` - Xóa địa chỉ

### Vouchers
- `GET /api/vouchers` - Lấy danh sách voucher
- `POST /api/vouchers/check` - Kiểm tra voucher

## Database Schema

Hệ thống sử dụng 15 bảng chính:
- `danh_muc` - Danh mục sản phẩm
- `san_pham` - Sản phẩm
- `hinh_anh_san_pham` - Hình ảnh sản phẩm
- `khach_hang` - Khách hàng
- `gio_hang` - Giỏ hàng
- `chi_tiet_gio_hang` - Chi tiết giỏ hàng
- `don_hang` - Đơn hàng
- `chi_tiet_don_hang` - Chi tiết đơn hàng
- `danh_gia_phan_hoi` - Đánh giá sản phẩm
- `voucher` - Voucher/Giảm giá
- `dia_chi_giao_hang` - Địa chỉ giao hàng
- `thanh_toan` - Thanh toán
- `wishlist` - Danh sách yêu thích
- `thong_bao` - Thông báo
- `nguoi_dung_admin` - Người dùng quản trị

## Lưu ý

- Mật khẩu được hash bằng bcrypt
- JWT token được sử dụng cho authentication
- API endpoints yêu cầu đăng nhập sẽ cần header: `Authorization: Bearer <token>`
- Thay đổi `JWT_SECRET` trong file `.env` khi deploy production

## Troubleshooting

Nếu PowerShell có vấn đề với đường dẫn có dấu, sử dụng Command Prompt (cmd) thay thế.
