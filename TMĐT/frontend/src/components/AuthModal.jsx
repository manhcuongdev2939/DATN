import React, { useState } from 'react';
import { authAPI } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
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

  const handleRequestOTP = async () => {
    if (!formData.Email) {
      setError('Vui lòng nhập email');
      return;
    }

    setSendingOTP(true);
    setError('');

    try {
      const result = await authAPI.requestOTP(formData.Email);
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
      let result;
      if (isLogin) {
        if (loginMethod === 'otp') {
          if (!otpSent) {
            await handleRequestOTP();
            setLoading(false);
            return;
          }
          result = await authAPI.loginOTP(formData.Email, formData.otp);
        } else {
          result = await authAPI.login(formData.Email, formData.Mat_khau);
        }
      } else {
        result = await authAPI.register(formData);
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess && onSuccess(result.user);
        onClose();
        // Reset form
        setOtpSent(false);
        setLoginMethod('password');
        setFormData({
          Ten_khach_hang: '',
          Email: '',
          Mat_khau: '',
          otp: '',
          So_dien_thoai: '',
          Dia_chi_mac_dinh: '',
        });
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input
                type="text"
                required
                value={formData.Ten_khach_hang}
                onChange={(e) => setFormData({ ...formData, Ten_khach_hang: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.Email}
              onChange={(e) => {
                setFormData({ ...formData, Email: e.target.value });
                setOtpSent(false);
              }}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          {isLogin && (
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setOtpSent(false);
                    setFormData({ ...formData, otp: '' });
                  }}
                  className={`flex-1 py-2 text-sm rounded border ${
                    loginMethod === 'password'
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  Mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setOtpSent(false);
                    setFormData({ ...formData, Mat_khau: '', otp: '' });
                  }}
                  className={`flex-1 py-2 text-sm rounded border ${
                    loginMethod === 'otp'
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  Mã OTP
                </button>
              </div>
            </div>
          )}

          {isLogin && loginMethod === 'otp' ? (
            <div className="mb-4">
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={sendingOTP || !formData.Email}
                  className="w-full rounded bg-brand-600 text-white py-2 text-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {sendingOTP ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-1">Mã OTP</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                    placeholder="Nhập 6 số OTP"
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={sendingOTP}
                    className="mt-2 text-sm text-brand-600 hover:underline"
                  >
                    {sendingOTP ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Mật khẩu</label>
              <input
                type="password"
                required={loginMethod === 'password'}
                value={formData.Mat_khau}
                onChange={(e) => setFormData({ ...formData, Mat_khau: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          )}

          {!isLogin && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.So_dien_thoai}
                  onChange={(e) => setFormData({ ...formData, So_dien_thoai: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.Dia_chi_mac_dinh}
                  onChange={(e) => setFormData({ ...formData, Dia_chi_mac_dinh: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (isLogin && loginMethod === 'otp' && !otpSent)}
            className="w-full rounded bg-brand-600 text-white py-2 text-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : isLogin ? (loginMethod === 'otp' && !otpSent ? 'Gửi mã OTP' : 'Đăng nhập') : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-brand-600 hover:underline"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

