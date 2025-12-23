import bcrypt from "bcryptjs";
import pool from "../db.js";
import "dotenv/config";
import readline from "readline/promises";

async function createAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("--- Tạo tài khoản Super Admin ---");
    const Ten_dang_nhap = await rl.question(
      "Nhập Tên đăng nhập (mặc định: admin): "
    );
    const Ho_ten = await rl.question(
      "Nhập Họ và tên (mặc định: Quản trị viên): "
    );
    const Email = await rl.question(
      "Nhập Email (mặc định: admin@example.com): "
    );
    const Mat_khau = await rl.question("Nhập Mật khẩu (tối thiểu 8 ký tự): ");

    if (!Mat_khau || Mat_khau.length < 8) {
      console.log(
        "❌ Mật khẩu phải có ít nhất 8 ký tự. Vui lòng chạy lại script."
      );
      return;
    }

    const adminData = {
      Ten_dang_nhap: Ten_dang_nhap || "admin",
      Ho_ten: Ho_ten || "Quản trị viên",
      Email: Email || "admin@example.com",
      Vai_tro: "super_admin", // Luôn là super_admin cho script này
      Trang_thai: "active",
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(Mat_khau, 10);

    // Kiểm tra xem admin đã tồn tại chưa
    const [existing] = await pool.query(
      "SELECT ID, ID_Admin FROM nguoi_dung_admin WHERE Email = ? OR Ten_dang_nhap = ?",
      [adminData.Email, adminData.Ten_dang_nhap]
    );

    if (existing.length > 0) {
      console.log("⚠️  Admin với email hoặc tên đăng nhập này đã tồn tại!");
      return;
    }

    // Tạo admin mới
    await pool.query(
      `INSERT INTO nguoi_dung_admin 
       (Ten_dang_nhap, Mat_khau_hash, Ho_ten, Email, Vai_tro, Trang_thai) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminData.Ten_dang_nhap,
        hashedPassword,
        adminData.Ho_ten,
        adminData.Email,
        adminData.Vai_tro,
        adminData.Trang_thai,
      ]
    );

    console.log("\n✅ Tạo admin thành công!");
    console.log("------------------------------------");
    console.log("👤 Tên đăng nhập:", adminData.Ten_dang_nhap);
    console.log("📧 Email:", adminData.Email);
    console.log("🔑 Mật khẩu: [BẠN VỪA NHẬP]");
    console.log(
      "\n🔗 Bây giờ bạn có thể đăng nhập tại: http://localhost:5173/admin/login"
    );
  } catch (error) {
    console.error("❌ Lỗi khi tạo admin:", error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
