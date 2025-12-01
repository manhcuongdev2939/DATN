import 'dotenv/config';
import mysql from 'mysql2/promise';

// Create a MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'admin',
  database: process.env.MYSQL_DATABASE || 'demo',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

const MAX_RETRIES = Number(process.env.DB_MAX_RETRIES || 5);
const RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 2000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testConnection = async (attempt = 1) => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối database thành công');
    connection.release();
  } catch (error) {
    console.error(`❌ Lỗi kết nối database (lần ${attempt}/${MAX_RETRIES}):`, error.message);
    if (attempt >= MAX_RETRIES) {
      console.error('💥 Hết số lần thử kết nối. Kiểm tra lại cấu hình database trong file .env');
      throw error;
    }
    console.log(`⏳ Thử kết nối lại sau ${RETRY_DELAY_MS}ms...`);
    await sleep(RETRY_DELAY_MS);
    return testConnection(attempt + 1);
  }
};

testConnection().catch(() => {
  process.exit(1);
});

export default pool;
