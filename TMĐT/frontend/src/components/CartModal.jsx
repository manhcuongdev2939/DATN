import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { cartAPI } from "../utils/api";
import {
  getCart as getGuestCart,
  updateQuantity as updateGuestQty,
  removeItem as removeGuestItem,
} from "../utils/guestCart";

export default function CartModal({ isOpen, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
    const handleCartUpdated = () => {
      if (isOpen) loadCart();
    };
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, [isOpen]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.get();
      setCart(data);
    } catch (err) {
      // fallback guest cart
      const guest = getGuestCart();
      setCart({
        items: guest.items.map((i) => ({
          ID_Chi_tiet_GH: i.id,
          Ten_san_pham: i.name,
          So_luong: i.quantity,
          Gia_tai_thoi_diem_them: i.price,
          Thanh_tien: Number(i.price || 0) * Number(i.quantity || 0),
          Thumbnail: i.thumbnail,
        })),
        total: guest.total,
      });
      if (guest.items.length === 0) {
        toast.error("Không thể tải giỏ hàng");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cartAPI.update(itemId, newQuantity);
      await loadCart();
      onUpdate && onUpdate();
    } catch (err) {
      updateGuestQty(itemId, newQuantity);
      await loadCart();
      onUpdate && onUpdate();
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      await loadCart();
      onUpdate && onUpdate();
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err) {
      removeGuestItem(itemId);
      await loadCart();
      onUpdate && onUpdate();
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Giỏ hàng của bạn
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-2xl font-bold transition"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-lg font-medium text-gray-500">
            Đang tải...
          </div>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-lg">
            Giỏ hàng trống
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.ID_Chi_tiet_GH}
                  className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition border"
                >
                  <img
                    src={
                      item.Thumbnail ||
                      "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20300%20300'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23e5e7eb'/%3E%3Ctext%20x='50%25'%20y='50%25'%20dominant-baseline='middle'%20text-anchor='middle'%20fill='%239ca3af'%20font-size='20'%3ENo%20image%3C/text%3E%3C/svg%3E"
                    }
                    alt={item.Ten_san_pham}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {item.Ten_san_pham}
                        </h3>
                        <div className="text-sm text-gray-500 mb-1">
                          Đơn giá:{" "}
                          <span className="font-medium text-brand-600">
                            {Number(item.Gia_tai_thoi_diem_them).toLocaleString(
                              "vi-VN"
                            )}
                            ₫
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.ID_Chi_tiet_GH,
                              item.So_luong - 1
                            )
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 bg-white text-lg font-bold flex items-center justify-center hover:bg-gray-200 transition"
                          aria-label="Giảm số lượng"
                        >
                          –
                        </button>
                        <span className="w-10 text-center text-base font-semibold">
                          {item.So_luong}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.ID_Chi_tiet_GH,
                              item.So_luong + 1
                            )
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 bg-white text-lg font-bold flex items-center justify-center hover:bg-gray-200 transition"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemove(item.ID_Chi_tiet_GH)}
                          className="ml-2 text-red-500 hover:bg-red-100 rounded-full p-2 transition"
                          aria-label="Xóa sản phẩm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-base text-gray-600">
                        Thành tiền:{" "}
                      </span>
                      <span className="text-lg font-bold text-brand-700">
                        {Number(item.Thanh_tien).toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <span className="text-xl font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-brand-600">
                  {Number(cart.total).toLocaleString("vi-VN")}₫
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
                className="w-full rounded-full bg-brand-600 text-white py-3 text-lg font-semibold shadow hover:bg-brand-700 transition"
              >
                Thanh toán ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
