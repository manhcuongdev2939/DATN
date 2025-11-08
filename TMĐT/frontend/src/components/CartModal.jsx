import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../utils/api';

export default function CartModal({ isOpen, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.get();
      setCart(data);
    } catch (err) {
      setError('Không thể tải giỏ hàng');
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
      setError('Không thể cập nhật số lượng');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      await loadCart();
      onUpdate && onUpdate();
    } catch (err) {
      setError('Không thể xóa sản phẩm');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Giỏ hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Giỏ hàng trống</div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.ID_Chi_tiet_GH} className="flex gap-4 border-b pb-4">
                  <img
                    src={item.Thumbnail || 'https://via.placeholder.com/100'}
                    alt={item.Ten_san_pham}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.Ten_san_pham}</h3>
                    <p className="text-sm text-gray-600">
                      {Number(item.Gia_tai_thoi_diem_them).toLocaleString('vi-VN')}₫
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.ID_Chi_tiet_GH, item.So_luong - 1)}
                        className="w-6 h-6 rounded border text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.So_luong}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.ID_Chi_tiet_GH, item.So_luong + 1)}
                        className="w-6 h-6 rounded border text-sm"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemove(item.ID_Chi_tiet_GH)}
                        className="ml-auto text-red-600 text-sm hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {Number(item.Thanh_tien).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-xl font-bold text-brand-600">
                  {Number(cart.total).toLocaleString('vi-VN')}₫
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
                className="w-full rounded bg-brand-600 text-white py-2 hover:bg-brand-700"
              >
                Thanh toán
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

