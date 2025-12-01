import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
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
  const [showPassword, setShowPassword] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Reset form when modal closes or switches mode
  useEffect(() => {
    if (!isOpen) {
      setOtpSent(false);
      setError('');
      setFieldErrors({});
      setFormData({
        Ten_khach_hang: '',
        Email: '',
        Mat_khau: '',
        otp: '',
        So_dien_thoai: '',
        Dia_chi_mac_dinh: '',
      });
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'Email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errors[name] = 'Vui lòng nhập email';
        } else if (!emailRegex.test(value)) {
          errors[name] = 'Email không hợp lệ';
        } else {
          delete errors[name];
        }
        break;
      case 'Mat_khau':
        if (!value) {
          errors[name] = 'Vui lòng nhập mật khẩu';
        } else if (value.length < 6) {
          errors[name] = 'Mật khẩu phải có ít nhất 6 ký tự';
        } else {
          delete errors[name];
        }
        break;
      case 'Ten_khach_hang':
        if (!value.trim()) {
          errors[name] = 'Vui lòng nhập họ tên';
        } else if (value.trim().length < 2) {
          errors[name] = 'Họ tên phải có ít nhất 2 ký tự';
        } else {
          delete errors[name];
        }
        break;
    }
    
    setFieldErrors(errors);
    return !errors[name];
  };

  const handleRequestRegisterOTP = async () => {
    if (!validateField('Email', formData.Email)) {
      return;
    }

    setSendingOTP(true);
    setError('');

    try {
      const result = await authAPI.requestRegisterOTP(formData.Email);
      if (result?.error) {
        setError(result.error);
      } else {
        setOtpSent(true);
        setOtpCountdown(60);
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
        // Đăng nhập
        if (!validateField('Email', formData.Email) || !validateField('Mat_khau', formData.Mat_khau)) {
          return;
        }
        result = await authAPI.login(formData.Email, formData.Mat_khau);
      } else {
        // Đăng ký cần OTP
        if (!validateField('Ten_khach_hang', formData.Ten_khach_hang) || 
            !validateField('Email', formData.Email) || 
            !validateField('Mat_khau', formData.Mat_khau)) {
          return;
        }
        if (!otpSent) {
          await handleRequestRegisterOTP();
          return;
        }
        if (!formData.otp || formData.otp.length !== 6) {
          setError('Vui lòng nhập mã OTP hợp lệ (6 số)');
          return;
        }
        result = await authAPI.register({
          Ten_khach_hang: formData.Ten_khach_hang,
          Email: formData.Email,
          Mat_khau: formData.Mat_khau,
          So_dien_thoai: formData.So_dien_thoai,
          Dia_chi_mac_dinh: formData.Dia_chi_mac_dinh,
          otp: formData.otp,
        });
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess && onSuccess(result.user);
        onClose();
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setOtpSent(false);
    setOtpCountdown(0);
    setFieldErrors({});
    setFormData({
      Ten_khach_hang: '',
      Email: '',
      Mat_khau: '',
      otp: '',
      So_dien_thoai: '',
      Dia_chi_mac_dinh: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Đăng nhập' : 'Đăng ký'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Đóng"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-shake">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.Ten_khach_hang}
                  onChange={(e) => {
                    setFormData({ ...formData, Ten_khach_hang: e.target.value });
                    if (fieldErrors.Ten_khach_hang) validateField('Ten_khach_hang', e.target.value);
                  }}
                  onBlur={() => validateField('Ten_khach_hang', formData.Ten_khach_hang)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    fieldErrors.Ten_khach_hang ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập họ tên"
                />
                {fieldErrors.Ten_khach_hang && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.Ten_khach_hang}</p>
                )}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.Email}
                onChange={(e) => {
                  setFormData({ ...formData, Email: e.target.value });
                  setOtpSent(false);
                  if (fieldErrors.Email) validateField('Email', e.target.value);
                }}
                onBlur={() => validateField('Email', formData.Email)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                  fieldErrors.Email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {fieldErrors.Email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.Email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.Mat_khau}
                  onChange={(e) => {
                    setFormData({ ...formData, Mat_khau: e.target.value });
                    if (fieldErrors.Mat_khau) validateField('Mat_khau', e.target.value);
                  }}
                  onBlur={() => validateField('Mat_khau', formData.Mat_khau)}
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    fieldErrors.Mat_khau ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.Mat_khau && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.Mat_khau}</p>
              )}
            </div>

            {/* OTP Section (Register only) */}
            {!isLogin && (
              <div>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleRequestRegisterOTP}
                    disabled={sendingOTP || !formData.Email || fieldErrors.Email}
                    className="w-full rounded-lg bg-brand-600 text-white py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingOTP ? 'Đang gửi...' : 'Gửi mã OTP xác thực'}
                  </button>
                ) : (
                  <div className="space-y-2 p-4 bg-brand-50 border border-brand-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700">
                      Mã OTP xác thực <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      placeholder="Nhập 6 số OTP"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-xl tracking-widest font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleRequestRegisterOTP}
                      disabled={sendingOTP || otpCountdown > 0}
                      className="w-full text-xs text-brand-600 hover:text-brand-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {otpCountdown > 0 ? `Gửi lại sau ${otpCountdown}s` : 'Gửi lại mã OTP'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Optional Fields (Register only) */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.So_dien_thoai}
                    onChange={(e) => setFormData({ ...formData, So_dien_thoai: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Tùy chọn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    rows="2"
                    value={formData.Dia_chi_mac_dinh}
                    onChange={(e) => setFormData({ ...formData, Dia_chi_mac_dinh: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    placeholder="Tùy chọn"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isLogin && !otpSent)}
              className="w-full rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3 text-sm font-semibold hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                isLogin ? 'Đăng nhập' : (otpSent ? 'Đăng ký' : 'Gửi mã OTP')
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center text-sm">
            <button
              onClick={handleSwitchMode}
              className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
