import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function RegisterPage({ onSuccess }) {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    Ten_khach_hang: '',
    Email: '',
    Mat_khau: '',
    otp: '',
    So_dien_thoai: '',
    Dia_chi_mac_dinh: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);

  const handleRequestRegisterOTP = async () => {
    if (!formData.Email) {
      setError('Vui lòng nhập email');
      return;
    }

    setSendingOTP(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: formData.Email }),
      });
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        setOtpSent(true);
        setError('');
      }
    } catch (err) {
      setError('Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Đăng ký cần OTP
      if (!otpSent) {
        await handleRequestRegisterOTP();
        setLoading(false);
        return;
      }
      if (!formData.otp) {
        setError('Vui lòng nhập mã OTP');
        setLoading(false);
        return;
      }
      const result = await authAPI.register({
        Ten_khach_hang: formData.Ten_khach_hang,
        Email: formData.Email,
        Mat_khau: formData.Mat_khau,
        So_dien_thoai: formData.So_dien_thoai,
        Dia_chi_mac_dinh: formData.Dia_chi_mac_dinh,
        otp: formData.otp,
      });

      if (result.error) {
        setError(result.error);
      } else {
        if (onSuccess) {
          onSuccess(result.user);
        }
        navigate('/');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng ký tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Họ tên *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.Ten_khach_hang}
                onChange={(e) => setFormData({ ...formData, Ten_khach_hang: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Nhập họ tên của bạn"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.Email}
                onChange={(e) => {
                  setFormData({ ...formData, Email: e.target.value });
                  setOtpSent(false);
                }}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Nhập email của bạn"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.Mat_khau}
                onChange={(e) => setFormData({ ...formData, Mat_khau: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div>
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleRequestRegisterOTP}
                  disabled={sendingOTP || !formData.Email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  {sendingOTP ? 'Đang gửi...' : 'Gửi mã OTP xác thực'}
                </button>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Mã OTP xác thực *
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                    placeholder="Nhập 6 số OTP đã gửi đến email"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRequestRegisterOTP}
                    disabled={sendingOTP}
                    className="mt-2 text-sm text-brand-600 hover:underline"
                  >
                    {sendingOTP ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.So_dien_thoai}
                onChange={(e) => setFormData({ ...formData, So_dien_thoai: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Nhập số điện thoại (tùy chọn)"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.Dia_chi_mac_dinh}
                onChange={(e) => setFormData({ ...formData, Dia_chi_mac_dinh: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Nhập địa chỉ (tùy chọn)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !otpSent}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : otpSent ? 'Đăng ký' : 'Gửi mã OTP'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Quay về trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

