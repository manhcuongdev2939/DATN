import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI, adminAPI, getToken, getAdminToken } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, adminLogin } = useAuth();
  
  // Get email from URL params if coming from register page
  const urlParams = new URLSearchParams(location.search);
  const emailFromUrl = urlParams.get('email');
  const loginType = urlParams.get('type') || 'customer'; // 'customer' or 'admin'
  
  const [formData, setFormData] = useState({
    Email: emailFromUrl || '',
    Mat_khau: '',
  });
  
  // Update email if URL param changes
  useEffect(() => {
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, Email: emailFromUrl }));
    }
  }, [emailFromUrl]);

  // Redirect if already logged in
  useEffect(() => {
    if (loginType === 'admin' && getAdminToken()) {
      navigate('/admin');
    } else if (loginType === 'customer' && getToken()) {
      navigate('/');
    }
  }, [loginType, navigate]);


  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    
    // --- Validation logic moved inside handleSubmit ---
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.Email || !emailRegex.test(formData.Email)) {
      setEmailError('Vui lòng nhập một email hợp lệ.');
      isValid = false;
    }
    if (!formData.Mat_khau || formData.Mat_khau.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự.');
      isValid = false;
    }
    if (!isValid) return;

    setLoading(true);

    try {
      let result;
      // Sử dụng AuthContext để set state đúng cách
      if (loginType === 'admin') {
        result = await adminLogin(formData.Email, formData.Mat_khau);
      } else {
        result = await login(formData.Email, formData.Mat_khau);
      }
      
      // Đăng nhập thành công
      if (onSuccess) {
        onSuccess(result.user || result.admin);
      }
      // Chuyển hướng: preserve intended destination or go to default
      const from = location.state?.from?.pathname;
      if (loginType === 'admin') {
        navigate(from || '/admin', { replace: true });
      } else {
        // For customer: redirect to intended page or home
        navigate(from || '/', { replace: true });
      }
    } catch (err) {
      // Sửa lỗi: Đọc thông báo lỗi từ thuộc tính `message` của đối tượng Error
      const errorMessage = err.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
              {loginType === 'admin' ? 'Đăng nhập Quản trị' : 'Chào mừng trở lại'}
            </h2>
            <p className="text-sm text-gray-600 capitalize">
              {loginType === 'admin' ? 'Đăng nhập để quản lý hệ thống' : 'Đăng nhập để tiếp tục mua sắm'}
            </p>
            
            {/* Toggle between Customer and Admin login - chỉ hiển thị khi type=admin */}
            {loginType === 'admin' && (
              <div className="mt-4 flex items-center justify-center">
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-all text-gray-600 hover:text-gray-900"
                  >
                    Khách hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login?type=admin')}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-white text-brand-600 shadow-sm"
                  >
                    Quản trị
                  </button>
                </div>
              </div>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {emailFromUrl && (
                <div className="mb-2 p-2 bg-brand-50 border border-brand-200 rounded-lg flex items-center gap-2 text-xs text-brand-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Email đã được điền tự động từ trang đăng ký</span>
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
                    setFormData(prev => ({ ...prev, Email: e.target.value }));
                  }}
                  onFocus={() => setEmailError('')}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm ${
                    emailError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  placeholder="your.email@example.com"
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
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
                  autoComplete="current-password"
                  required
                  value={formData.Mat_khau}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, Mat_khau: e.target.value }));
                  }}
                  onFocus={() => setPasswordError('')}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm ${
                    passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
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
              {passwordError && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Register Link */}
            {loginType !== 'admin' && (
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Chưa có tài khoản?
                </p>
                <Link 
                  to={`/register${formData.Email ? `?email=${encodeURIComponent(formData.Email)}` : ''}`}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-brand-600 text-brand-600 font-semibold hover:bg-brand-50 hover:border-brand-700 transition-all group"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Tạo tài khoản mới</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Back to Home */}
            <div className="text-center pt-2">
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay về trang chủ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
