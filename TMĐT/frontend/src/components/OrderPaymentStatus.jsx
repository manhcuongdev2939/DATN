import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ordersAPI } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner"; // Assuming you have this component

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function OrderPaymentStatus() {
  const navigate = useNavigate();
  const query = useQuery();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' or 'cancelled'

  useEffect(() => {
    const orderId = query.get("orderId");
    const status = query.get("status");

    setPaymentStatus(status);

    if (orderId) {
      loadOrder(orderId);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  const loadOrder = async (orderId) => {
    try {
      const data = await ordersAPI.getById(orderId);
      setOrder(data || {});
    } catch (err) {
      console.error("Load order error:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const isSuccess = paymentStatus === "success";

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="mb-6">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isSuccess ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isSuccess ? (
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSuccess ? "Đặt hàng thành công!" : "Thanh toán đã bị hủy"}
            </h1>
            <p className="text-gray-600">
              {isSuccess
                ? "Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn ngay."
                : "Quá trình thanh toán đã bị hủy. Bạn có thể thử lại."}
            </p>
          </div>

          {order && order.order && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold">
                    {order.order.Ma_don_hang || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-semibold text-brand-600">
                    {Number(order.order.Thanh_tien || 0).toLocaleString(
                      "vi-VN"
                    )}
                    ₫
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            {isSuccess ? (
              <>
                <button
                  onClick={() => navigate("/orders")}
                  className="rounded bg-brand-600 text-white px-6 py-2 hover:bg-brand-700"
                >
                  Xem đơn hàng
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50"
                >
                  Tiếp tục mua sắm
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/checkout/${order?.order?.ID_Don_hang || ''}`)}
                  className="rounded bg-brand-600 text-white px-6 py-2 hover:bg-brand-700"
                >
                  Thử lại thanh toán
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50"
                >
                  Về trang chủ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
