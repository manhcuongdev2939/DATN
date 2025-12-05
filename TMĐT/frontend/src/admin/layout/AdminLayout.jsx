import { Outlet, NavLink } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>ADMIN</h2>
        <nav>
          <NavLink to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/products">Sản phẩm</NavLink>
          <NavLink to="/admin/orders">Đơn hàng</NavLink>
          <NavLink to="/admin/users">Khách hàng</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
