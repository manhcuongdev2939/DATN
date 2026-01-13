import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ordersAPI } from "../utils/api";

export default function OrderCancel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("Đang xử lý hủy đơn hàng...");

  useEffect(() => {
    if (id) {
      cancelOrder();
    }
  }, [id]);

  const cancelOrder = async () => {
    try {
      // Gọi API hủy đơn hàng phía backend để hoàn lại kho và voucher
      await ordersAPI.cancel(id);
      setStatus("success");
      setMessage(
        "Đơn hàng đã được hủy thành công. Bạn có thể tiếp tục mua sắm."
      );
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);

      // Lỗi 400: Yêu cầu không hợp lệ (ví dụ: đơn hàng đang giao, đã hoàn thành)
      if (error.status === 400) {
        const currentState = error.data?.error?.details?.currentState;

        // Nếu backend xác nhận đơn hàng đã ở trạng thái "cancelled"
        if (currentState === "cancelled") {
          setStatus("success");
          setMessage("Đơn hàng này đã được hủy trước đó.");
        } else {
          // Hiển thị thông báo lỗi cụ thể từ backend
          setStatus("error");
          setMessage(
            error.data?.error?.message ||
              "Không thể hủy đơn hàng ở trạng thái hiện tại."
          );
        }
      }
      // Các loại lỗi khác (500, network error, etc.)
      else {
        setStatus("error");
        setMessage(
          error.message || "Không thể hủy đơn hàng. Vui lòng thử lại."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow text-center">
        <div>
          {status === "processing" && (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-8 w-8 text-blue-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
          {status === "success" && (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {status === "success"
              ? "Đã hủy thanh toán"
              : status === "error"
              ? "Lỗi"
              : "Đang xử lý"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => navigate("/")}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
