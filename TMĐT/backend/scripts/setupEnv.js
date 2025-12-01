import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const examplePath = path.join(projectRoot, 'ENV_EXAMPLE.txt');

if (fs.existsSync(envPath)) {
  console.log('✅ .env đã tồn tại - bỏ qua bước sao chép.');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error('❌ Không tìm thấy file ENV_EXAMPLE.txt. Vui lòng tạo thủ công.');
  process.exit(1);
}

fs.copyFileSync(examplePath, envPath);
console.log('✨ Đã tạo backend/.env từ ENV_EXAMPLE.txt. Hãy cập nhật giá trị phù hợp.');

