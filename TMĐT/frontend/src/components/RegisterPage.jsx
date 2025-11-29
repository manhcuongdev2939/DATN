import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function RegisterPage({ onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from URL params if coming from login page
  const urlParams = new URLSearchParams(location.search);
  const emailFromUrl = urlParams.get('email');
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Thông tin còn lại
  const [otpVerified, setOtpVerified] = useState(false);
  const [formData, setFormData] = useState({
    Ten_khach_hang: '',
    Email: emailFromUrl || '',
    Mat_khau: '',
    otp: '',
    So_dien_thoai: '',
    Dia_chi_mac_dinh: '',
  });
  
  // Update email if URL param changes
  useEffect(() => {
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, Email: emailFromUrl }));
    }
  }, [emailFromUrl]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.Mat_khau;
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [formData.Mat_khau]);

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'Ten_khach_hang':
        if (!value.trim()) {
          errors[name] = 'Vui lòng nhập họ tên';
        } else if (value.trim().length < 2) {
          errors[name] = 'Họ tên phải có ít nhất 2 ký tự';
        } else {
          delete errors[name];
        }
        break;
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
      case 'So_dien_thoai':
        if (value && !/^[0-9]{10,11}$/.test(value.replace(/\s/g, ''))) {
          errors[name] = 'Số điện thoại không hợp lệ';
        } else {
          delete errors[name];
        }
        break;
    }
    
    setFieldErrors(errors);
    return !errors[name];
  };

  // Bước 1: Gửi OTP
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!validateField('Email', formData.Email)) {
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
        setStep(2);
        setOtpCountdown(60);
        setError('');
      }
    } catch (err) {
      setError('Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setSendingOTP(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Vui lòng nhập mã OTP hợp lệ (6 số)');
      return;
    }

    setVerifyingOTP(true);
    setError('');

    // Chuyển sang bước 3 ngay (OTP sẽ được verify khi submit form cuối cùng)
    // Nếu OTP sai, backend sẽ trả về lỗi và ta sẽ quay lại bước 2
    setOtpVerified(true);
    setStep(3);
    setVerifyingOTP(false);
  };

  // Bước 3: Đăng ký với thông tin đầy đủ
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all required fields
    const isNameValid = validateField('Ten_khach_hang', formData.Ten_khach_hang);
    const isPasswordValid = validateField('Mat_khau', formData.Mat_khau);
    
    if (!isNameValid || !isPasswordValid) {
      return;
    }

    if (!otpVerified) {
      setError('Vui lòng xác thực email trước');
      return;
    }

    setLoading(true);

    try {
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
        // Nếu OTP sai hoặc hết hạn, quay lại bước 2
        if (result.error.includes('OTP') || result.error.includes('otp') || result.error.includes('hết hạn')) {
          setStep(2);
          setOtpVerified(false);
          setFormData({ ...formData, otp: '' }); // Reset OTP để người dùng nhập lại
        }
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

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { text: '', color: '' };
    if (passwordStrength <= 2) return { text: 'Yếu', color: 'bg-red-500' };
    if (passwordStrength === 3) return { text: 'Trung bình', color: 'bg-yellow-500' };
    return { text: 'Mạnh', color: 'bg-green-500' };
  };

  const strengthLabel = getPasswordStrengthLabel();

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtpCountdown(0);
      setFormData({ ...formData, otp: '' });
    } else if (step === 3) {
      setStep(2);
      setOtpVerified(false);
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Tạo tài khoản mới
            </h2>
            <p className="text-sm text-gray-600">
              {step === 1 && 'Bước 1/3: Xác thực email của bạn'}
              {step === 2 && 'Bước 2/3: Nhập mã OTP'}
              {step === 3 && 'Bước 3/3: Hoàn tất thông tin'}
            </p>
            
            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 mx-1 transition-all ${
                      step > s ? 'bg-brand-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-shake">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                {emailFromUrl && (
                  <div className="mb-2 p-2 bg-brand-50 border border-brand-200 rounded-lg flex items-center gap-2 text-xs text-brand-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Email đã được điền tự động từ trang đăng nhập</span>
                  </div>
                )}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.Email}
                    onChange={(e) => {
                      setFormData({ ...formData, Email: e.target.value });
                      if (fieldErrors.Email) validateField('Email', e.target.value);
                    }}
                    onBlur={() => validateField('Email', formData.Email)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm ${
                      fieldErrors.Email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {fieldErrors.Email && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.Email}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Chúng tôi sẽ gửi mã OTP đến email này để xác thực
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingOTP || !formData.Email || fieldErrors.Email}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {sendingOTP ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Gửi mã OTP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
                  <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kiểm tra email của bạn
                </h3>
                <p className="text-sm text-gray-600">
                  Chúng tôi đã gửi mã OTP 6 số đến
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formData.Email}
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã OTP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                    placeholder="Nhập 6 số OTP"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm text-center text-2xl tracking-widest font-semibold"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendingOTP || otpCountdown > 0}
                  className="flex-1 py-3 px-4 border border-brand-300 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : 'Gửi lại mã'}
                </button>
                <button
                  type="submit"
                  disabled={verifyingOTP || !formData.otp || formData.otp.length !== 6}
                  className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {verifyingOTP ? 'Đang xác thực...' : 'Xác thực'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Complete Registration */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-green-700">
                  <p className="font-medium">Email đã được xác thực!</p>
                  <p className="text-green-600">{formData.Email}</p>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.Ten_khach_hang}
                    onChange={(e) => {
                      setFormData({ ...formData, Ten_khach_hang: e.target.value });
                      if (fieldErrors.Ten_khach_hang) validateField('Ten_khach_hang', e.target.value);
                    }}
                    onBlur={() => validateField('Ten_khach_hang', formData.Ten_khach_hang)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm ${
                      fieldErrors.Ten_khach_hang ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Nhập họ tên của bạn"
                    autoFocus
                  />
                </div>
                {fieldErrors.Ten_khach_hang && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.Ten_khach_hang}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.Mat_khau}
                    onChange={(e) => {
                      setFormData({ ...formData, Mat_khau: e.target.value });
                      if (fieldErrors.Mat_khau) validateField('Mat_khau', e.target.value);
                    }}
                    onBlur={() => validateField('Mat_khau', formData.Mat_khau)}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm ${
                      fieldErrors.Mat_khau ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                {formData.Mat_khau && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= passwordStrength
                              ? strengthLabel.color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {strengthLabel.text && (
                      <p className="text-xs text-gray-600">
                        Độ mạnh: <span className={`font-medium ${strengthLabel.color.replace('bg-', 'text-')}`}>
                          {strengthLabel.text}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {fieldErrors.Mat_khau && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.Mat_khau}
                  </p>
                )}
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.So_dien_thoai}
                    onChange={(e) => {
                      setFormData({ ...formData, So_dien_thoai: e.target.value });
                      if (fieldErrors.So_dien_thoai) validateField('So_dien_thoai', e.target.value);
                    }}
                    onBlur={() => validateField('So_dien_thoai', formData.So_dien_thoai)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm ${
                      fieldErrors.So_dien_thoai ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Nhập số điện thoại (tùy chọn)"
                  />
                </div>
                {fieldErrors.So_dien_thoai && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.So_dien_thoai}
                  </p>
                )}
              </div>

              {/* Address Input */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    rows="2"
                    value={formData.Dia_chi_mac_dinh}
                    onChange={(e) => setFormData({ ...formData, Dia_chi_mac_dinh: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm resize-none hover:border-gray-400"
                    placeholder="Nhập địa chỉ (tùy chọn)"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                    <>
                      <span>Hoàn tất đăng ký</span>
                      <svg className="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="text-center pt-6 border-t border-gray-200 mt-6">
            <p className="text-sm text-gray-600 mb-3">
              Đã có tài khoản?
            </p>
            <Link 
              to={`/login${formData.Email ? `?email=${encodeURIComponent(formData.Email)}` : ''}`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-brand-600 text-brand-600 font-semibold hover:bg-brand-50 hover:border-brand-700 transition-all group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Đăng nhập ngay</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-2">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
