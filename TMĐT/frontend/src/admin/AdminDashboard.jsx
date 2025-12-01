import React from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { getAdminToken, adminAPI } from '../utils/api';
import ProductsList from './components/ProductsList';
import OrdersList from './components/OrdersList';
import UsersList from './components/UsersList';

function Sidebar({ onLogout }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Admin Dashboard</h3>
      </div>
      <nav className="flex flex-col gap-2">
        <Link to="/admin" className="px-3 py-2 rounded hover:bg-gray-50">Tổng quan</Link>
        <Link to="/admin/products" className="px-3 py-2 rounded hover:bg-gray-50">Sản phẩm</Link>
        <Link to="/admin/orders" className="px-3 py-2 rounded hover:bg-gray-50">Đơn hàng</Link>
        <Link to="/admin/users" className="px-3 py-2 rounded hover:bg-gray-50">Khách hàng</Link>
      </nav>
      <div className="mt-6">
        <button onClick={onLogout} className="w-full px-3 py-2 bg-red-600 text-white rounded">Đăng xuất</button>
      </div>
    </aside>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = getAdminToken();
    if (!token) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    adminAPI.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 flex gap-6">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 bg-white rounded-lg p-6 shadow">
          <Routes>
            <Route path="/" element={<div>Chào mừng đến trang quản trị. Chọn mục bên trái.</div>} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/users" element={<UsersList />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
