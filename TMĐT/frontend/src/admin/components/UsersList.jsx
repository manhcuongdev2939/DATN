import React from 'react';
import { adminAPI } from '../../utils/api';

export default function UsersList() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    adminAPI.getUsers({ page: 1, limit: 50 })
      .then(res => setUsers(res.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Khách hàng</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tên</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">SĐT</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.ID_Khach_hang}>
                  <td className="px-4 py-2 text-sm">{u.ID_Khach_hang}</td>
                  <td className="px-4 py-2 text-sm">{u.Ten_khach_hang}</td>
                  <td className="px-4 py-2 text-sm">{u.Email}</td>
                  <td className="px-4 py-2 text-sm">{u.So_dien_thoai}</td>
                  <td className="px-4 py-2 text-sm">{u.Trang_thai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
