import React from 'react';
import { adminAPI } from '../../utils/api';

export default function OrdersList() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    adminAPI.getOrders({ page: 1, limit: 50 })
      .then(res => setOrders(res.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Đơn hàng</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Mã</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Khách hàng</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tổng</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o.ID_Don_hang}>
                  <td className="px-4 py-2 text-sm">{o.ID_Don_hang}</td>
                  <td className="px-4 py-2 text-sm">{o.Ma_don_hang}</td>
                  <td className="px-4 py-2 text-sm">{o.Ten_khach_hang || o.Email}</td>
                  <td className="px-4 py-2 text-sm">{Number(o.Thanh_tien || o.Tong_tien).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-2 text-sm">{o.Trang_thai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
