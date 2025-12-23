import React from "react";
import { useUsers } from "../hooks/useUsers";
import DataTable from "./DataTable";

const UserManagement = () => {
  const { users, loading, handleEditUser } = useUsers();

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      active: "Hoạt động",
      inactive: "Ngừng hoạt động",
    };
    return texts[status] || status;
  };

  const userColumns = [
    {
      key: "name",
      header: "Tên",
      render: (user) => (
        <span className="text-sm font-medium text-gray-900">
          {user.Ten_khach_hang}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => (
        <span className="text-sm text-gray-500">{user.Email}</span>
      ),
    },
    {
      key: "phone",
      header: "Số điện thoại",
      render: (user) => (
        <span className="text-sm text-gray-500">
          {user.So_dien_thoai || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            user.Trang_thai
          )}`}
        >
          {getStatusText(user.Trang_thai)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Hành động",
      render: (user) => (
        <button
          onClick={() => handleEditUser(user)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Sửa
        </button>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-900">
        Quản lý người dùng
      </h2>
      <DataTable
        columns={userColumns}
        data={users}
        loading={loading}
        emptyMessage="Không có người dùng nào"
      />
    </div>
  );
};

export default UserManagement;
