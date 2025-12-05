import React from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { getAdminToken, adminAPI } from '../utils/api';
import ProductsList from './components/ProductsList';
import OrdersList from './components/OrdersList';
import UsersList from './components/UsersList';
import AdminOverview from './components/AdminOverview';

function Sidebar({ onLogout }) {
  const navLinkClasses = ({ isActive }) =>
    `px-3 py-2 rounded transition-colors ${
      isActive ? 'bg-gray-200 font-semibold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Admin Dashboard</h3>
      </div>
      <nav className="flex flex-col gap-2">
        {/* Sử dụng NavLink với `end` cho trang chủ để nó không active trên các trang con */}
        <NavLink to="/admin" end className={navLinkClasses}>Tổng quan</NavLink>
        <NavLink to="/admin/products" className={navLinkClasses}>Sản phẩm</NavLink>
        <NavLink to="/admin/orders" className={navLinkClasses}>Đơn hàng</NavLink>
        <NavLink to="/admin/users" className={navLinkClasses}>Khách hàng</NavLink>
      </nav>
      <div className="mt-6">
        <button onClick={onLogout} className="w-full px-3 py-2 bg-red-600 text-white rounded">Đăng xuất</button>
      </div>
    </aside>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

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
            <Route path="/" element={<AdminOverview />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/users" element={<UsersList />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
