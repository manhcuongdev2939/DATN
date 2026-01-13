import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ordersAPI } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await ordersAPI.getById(id);
        setOrder(data);
      } catch (err) {
        toast.error("Không thể tải chi tiết đơn hàng.");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
      returned: "Đã trả hàng",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipping: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-600 mb-6">
          Đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          to="/orders"
          className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
        >
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }
  
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <Link to="/orders" className="text-sm text-brand-600 hover:underline">
                &larr; Quay lại danh sách
            </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chi tiết đơn hàng
              </h1>
              <p className="text-sm text-gray-600">
                Mã đơn: <span className="font-medium">{order.Ma_don_hang}</span>
              </p>
              <p className="text-sm text-gray-600">
                Ngày đặt:{" "}
                <span className="font-medium">
                  {new Date(order.Ngay_dat).toLocaleString("vi-VN")}
                </span>
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
                <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.Trang_thai
                    )}`}
                >
                    {getStatusText(order.Trang_thai)}
                </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Items */}
            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Sản phẩm</h3>
                <div className="space-y-4">
                {order.items?.map((item, idx) => {
                    const imageUrl = item.Hinh_anh?.startsWith('http') ? item.Hinh_anh : `${BACKEND_URL}/uploads/${item.Hinh_anh}`;
                    const itemTotal = item.Don_gia_luc_dat * item.So_luong;
                    return (
                    <div key={idx} className="flex items-start text-sm">
                        <img src={imageUrl} alt={item.Ten_san_pham} className="w-16 h-16 object-cover rounded mr-4 border" />
                        <div className="flex-grow">
                        <div className="font-medium text-gray-800">{item.Ten_san_pham}</div>
                        <div className="text-gray-500">Số lượng: {item.So_luong}</div>
                        <div className="text-gray-500">
                            Đơn giá: {Number(item.Don_gia_luc_dat).toLocaleString("vi-VN")}₫
                        </div>
                        </div>
                        <div className="font-medium text-gray-800">
                        {Number(itemTotal).toLocaleString("vi-VN")}₫
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping & Payment */}
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Địa chỉ giao hàng</h3>
                        <div className="text-sm text-gray-600 leading-relaxed">
                            <div className="font-medium">{order.Ten_nguoi_nhan}</div>
                            <div>{order.So_dien_thoai}</div>
                            <div>{`${order.Dia_chi_cu_the}, ${order.Phuong_xa}, ${order.Quan_huyen}, ${order.Tinh_thanh}`}</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Thông tin thanh toán</h3>
                        <div className="text-sm text-gray-600">
                            Phương thức: <span className="font-medium">{order.Phuong_thuc_thanh_toan}</span>
                        </div>
                         <div className="text-sm text-gray-600">
                            Trạng thái: <span className="font-medium">{order.Trang_thai_thanh_toan}</span>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div>
                     <h3 className="font-semibold text-gray-800 mb-2">Tổng kết đơn hàng</h3>
                     <div className="text-sm space-y-2 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tạm tính:</span>
                            <span className="font-medium">{Number(order.Tong_tien).toLocaleString("vi-VN")}₫</span>
                          </div>
                          {order.Tien_giam_gia > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="text-gray-600">Giảm giá:</span>
                              <span className="font-medium">-{Number(order.Tien_giam_gia).toLocaleString("vi-VN")}₫</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phí vận chuyển:</span>
                            <span className="font-medium">{Number(order.Phi_van_chuyen).toLocaleString("vi-VN")}₫</span>
                          </div>
                          <div className="flex justify-between font-bold text-base pt-3 border-t mt-2">
                            <span>Tổng cộng:</span>
                            <span>{Number(order.Thanh_tien).toLocaleString("vi-VN")}₫</span>
                          </div>
                        </div>
                </div>
            </div>

            {order.Ghi_chu && (
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Ghi chú</h3>
                    <p className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg border">{order.Ghi_chu}</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
