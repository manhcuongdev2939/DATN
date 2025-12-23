# Hướng dẫn chạy Migration

## Thứ tự chạy các file SQL:

1. **01_create_tables.sql** - Tạo tất cả các bảng trong database
   ```sql
   -- Chạy file này trước tiên
   source 01_create_tables.sql;
   ```

2. **02_seed_data.sql** - Thêm dữ liệu mẫu (tùy chọn)
   ```sql
   -- Chạy file này sau khi đã tạo xong các bảng
   source 02_seed_data.sql;
   ```

3. **03_create_news.sql** - Tạo bảng cho module tin tức (nếu cần)
   ```sql
   source 03_create_news.sql;
   ```

4. **04_create_revoked_tokens.sql** - Tạo bảng lưu JWT đã bị thu hồi (logout/revoke)
   ```sql
   source 04_create_revoked_tokens.sql;
   ```

## Cách chạy:

### Option 1: Sử dụng MySQL Command Line
```bash
mysql -u root -p ecommerce < 01_create_tables.sql
mysql -u root -p ecommerce < 02_seed_data.sql
```

### Option 2: Sử dụng MySQL Workbench hoặc phpMyAdmin
- Mở file SQL trong editor
- Chạy từng file theo thứ tự

### Option 3: Sử dụng MySQL Shell
```sql
USE ecommerce;
SOURCE 01_create_tables.sql;
SOURCE 02_seed_data.sql;
```

## Lưu ý:

- Đảm bảo database `ecommerce` đã được tạo trước
- Kiểm tra file `.env` trong thư mục `backend` đã được cấu hình đúng
- Mật khẩu admin trong seed data cần được hash bằng bcrypt (có thể tạo qua API đăng ký)

## Tạo mật khẩu hash cho admin:

Có thể sử dụng script Node.js tạm thời:
```javascript
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('admin123', 10);
console.log(hash);
```

Hoặc sử dụng API đăng ký để tạo tài khoản admin đầu tiên.

