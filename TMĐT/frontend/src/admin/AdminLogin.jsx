import React from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';

export default function AdminLogin() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await adminAPI.login(username, password);
    setLoading(false);
    if (res && res.token) {
      navigate('/admin');
    } else {
      setError(res.error || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Quản trị viên - Đăng nhập</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-brand-500" />
          </div>
          <div>
            <label className="text-sm font-medium">Mật khẩu</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-brand-500" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center justify-between">
            <button disabled={loading} className="px-4 py-2 rounded bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50">{loading ? 'Đang...' : 'Đăng nhập'}</button>
            <a href="/" className="text-sm text-gray-500">Về trang chủ</a>
          </div>
        </form>
      </div>
    </div>
  );
}
