import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAdminToken } from '../../utils/api';

const ProtectedRoute = () => {
  const token = getAdminToken();

  // Nếu có token, cho phép truy cập vào các route con (sử dụng <Outlet />)
  // Nếu không, chuyển hướng về trang đăng nhập
  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;