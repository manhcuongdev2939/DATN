import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authAPI } from "../utils/api"; // Giả sử bạn có hàm set token trong này

const schema = yup.object({
  email: yup.string().email("Email không hợp lệ").required("Không được để trống"),
  password: yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Không được để trống")
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setLoginError(""); // Xóa lỗi cũ trước khi gửi yêu cầu mới

      // Gọi API để đăng nhập
      await authAPI.adminLogin(data.email, data.password);

      navigate("/admin"); // Chuyển hướng đến trang tổng quan của admin
    } catch (err) {
      // Hiển thị lỗi từ server hoặc một thông báo chung
       setLoginError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
      console.error('Login error (full error object):', err);
    } finally {
      // Luôn tắt trạng thái loading sau khi request hoàn tất
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Form đăng nhập admin">
        <h2>Đăng nhập quản trị</h2>

        {/* Hiển thị thông báo lỗi tại đây */}
        {loginError && <p className="error" role="alert">{loginError}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
        />
        <p id="email-error" className="error">{errors.email?.message}</p>

        <label htmlFor="password">Mật khẩu</label>
        <input
          id="password"
          type="password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby="pass-error"
        />
        <p id="pass-error" className="error">{errors.password?.message}</p>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  );
}
