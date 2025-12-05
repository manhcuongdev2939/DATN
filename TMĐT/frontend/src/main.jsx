import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import './index.css';

// Admin pages
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminLayout from "./admin/layout/AdminLayout.jsx";
import Dashboard from "./admin/pages/Dashboard.jsx";
import ProtectedAdmin from "./admin/ProtectedAdmin.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>

      {/* Website chính */}
      <Route path="/*" element={<App />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Layout + bảo vệ */}
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminLayout />
          </ProtectedAdmin>
        }
      >
        {/* Các trang con trong admin */}
        <Route index element={<Dashboard />} />
      </Route>

    </Routes>
  </BrowserRouter>
);



