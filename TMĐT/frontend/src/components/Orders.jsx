import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../utils/api';

export default function Orders({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll();
      setOrders(data || []);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      const data = await ordersAPI.getById(orderId);
      setSelectedOrder(data);
    } catch (err) {
      alert('Không thể tải chi tiết đơn hàng');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
      returned: 'Đã trả hàng',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipping: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">{error}</div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
            <button
              onClick={() => navigate('/')}
              className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.ID_Don_hang} className="bg-white rounded-lg p-6 border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg mb-1">
                      Mã đơn: {order.Ma_don_hang}
                    </div>
                    <div className="text-sm text-gray-600">
                      Ngày đặt: {new Date(order.Ngay_dat).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.Trang_thai)}`}>
                      {getStatusText(order.Trang_thai)}
                    </span>
                    <div className="mt-2 font-bold text-brand-600">
                      {Number(order.Thanh_tien).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {order.So_luong_san_pham} sản phẩm
                  </div>
                  <button
                    onClick={() => handleViewDetail(order.ID_Don_hang)}
                    className="text-brand-600 hover:underline text-sm font-medium"
                  >
                    Xem chi tiết
                  </button>
                </div>

                {selectedOrder && selectedOrder.order?.ID_Don_hang === order.ID_Don_hang && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-3">Chi tiết đơn hàng</h3>
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.Ten_san_pham} x{item.So_luong}</span>
                            <span>{Number(item.Thanh_tien).toLocaleString('vi-VN')}₫</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedOrder.order && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Tạm tính:</span>
                          <span>{Number(order.Tong_tien).toLocaleString('vi-VN')}₫</span>
                        </div>
                        {order.Tien_giam_gia > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Giảm giá:</span>
                            <span>-{Number(order.Tien_giam_gia).toLocaleString('vi-VN')}₫</span>
                          </div>
                        )}
                        {order.Phi_van_chuyen > 0 && (
                          <div className="flex justify-between">
                            <span>Phí vận chuyển:</span>
                            <span>{Number(order.Phi_van_chuyen).toLocaleString('vi-VN')}₫</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Tổng cộng:</span>
                          <span>{Number(order.Thanh_tien).toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>
                    )}
                    {selectedOrder.order?.Dia_chi_giao_hang && (
                      <div className="mt-4 pt-4 border-t text-sm">
                        <div className="font-medium mb-1">Địa chỉ giao hàng:</div>
                        <div className="text-gray-600">
                          {selectedOrder.order.Dia_chi_giao_hang}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="mt-4 text-sm text-gray-600 hover:underline"
                    >
                      Thu gọn
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

