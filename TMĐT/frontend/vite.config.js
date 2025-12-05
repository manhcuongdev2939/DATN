import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Tất cả các request bắt đầu bằng '/api' sẽ được chuyển tiếp
      '/api': {
        // !!! QUAN TRỌNG: Thay đổi target thành địa chỉ backend của bạn
        target: 'http://localhost:3001', // Sửa thành cổng 3001 để khớp với backend
        changeOrigin: true, // Cần thiết cho các máy chủ ảo
        secure: false,      // Hữu ích nếu backend của bạn không có chứng chỉ SSL hợp lệ
      },
    },
  },
});