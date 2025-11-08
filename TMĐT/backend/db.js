import 'dotenv/config';
import mysql from 'mysql2/promise';

// Create a MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'admin',
  database: process.env.MYSQL_DATABASE || 'TMĐT',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
pool.getConnection()
  .then((connection) => {
    console.log('✅ Kết nối database thành công');
    connection.release();
  })
  .catch((error) => {
    console.error('❌ Lỗi kết nối database:', error.message);
    console.error('💡 Kiểm tra lại cấu hình database trong file .env');
  });

export default pool;


