import { Navigate } from "react-router-dom";

export default function ProtectedAdmin({ children }) {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin/login" />;
}
