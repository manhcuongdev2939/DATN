# Dự án Tốt Nghiệp - Hệ thống Thương Mại Điện Tử

Dự án tốt nghiệp xây dựng hệ thống thương mại điện tử (MCM Shop) đầy đủ với React và Node.js.

## 📁 Cấu trúc dự án

```
.
├── TMĐT/                    # Thư mục chính của dự án
│   ├── backend/            # Backend API (Node.js + Express + MySQL)
│   └── frontend/           # Frontend (React + Vite + Tailwind CSS)
└── README.md               # File này
```

## 🚀 Bắt đầu

Xem hướng dẫn chi tiết trong file [TMĐT/README.md](./TMĐT/README.md)

### Tóm tắt nhanh:

1. **Cài đặt Backend:**
   ```bash
   cd TMĐT/backend
   npm install
   cp ENV_EXAMPLE.txt .env
   # Cập nhật thông tin database trong .env
   npm start
   ```

2. **Cài đặt Frontend:**
   ```bash
   cd TMĐT/frontend
   npm install
   npm run dev
   ```

3. **Cấu hình Database:**
   - Tạo database MySQL
   - Chạy file SQL migration: `TMĐT/backend/sql/01_create_tables.sql`
   - (Tùy chọn) Chạy seed data: `TMĐT/backend/sql/02_seed_data.sql`

## 📚 Tài liệu

Chi tiết về API, cấu trúc database và hướng dẫn sử dụng xem trong [TMĐT/README.md](./TMĐT/README.md)

## ⚠️ Lưu ý

- Đảm bảo MySQL đã được cài đặt và chạy
- Cập nhật thông tin database trong file `.env` của backend
- Thay đổi `JWT_SECRET` khi deploy production
- Cấu hình SMTP email nếu cần sử dụng tính năng gửi email OTP
