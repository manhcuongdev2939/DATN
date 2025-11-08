import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, addressesAPI, wishlistAPI } from '../utils/api';
import AddressManagement from './AddressManagement';
import Orders from './Orders';

export default function UserDashboard({ user, onLogout, onUpdateUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    Ten_khach_hang: user?.Ten_khach_hang || '',
    So_dien_thoai: user?.So_dien_thoai || '',
    Dia_chi_mac_dinh: user?.Dia_chi_mac_dinh || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // TODO: Implement update profile API
      // await authAPI.updateProfile(formData);
      setMessage('Cập nhật thành công!');
      onUpdateUser && onUpdateUser({ ...user, ...formData });
    } catch (err) {
      setMessage('Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: '👤' },
    { id: 'orders', label: 'Đơn hàng', icon: '📦' },
    { id: 'addresses', label: 'Địa chỉ', icon: '📍' },
    { id: 'wishlist', label: 'Yêu thích', icon: '❤️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tài khoản của tôi</h1>
          <p className="text-gray-600">Quản lý thông tin và đơn hàng của bạn</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-brand-100 text-brand-700 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 mt-4"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Thông tin cá nhân</h2>
                {message && (
                  <div className={`mb-4 p-3 rounded ${
                    message.includes('thành công') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {message}
                  </div>
                )}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Họ tên</label>
                    <input
                      type="text"
                      value={formData.Ten_khach_hang}
                      onChange={(e) => setFormData({ ...formData, Ten_khach_hang: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.Email || ''}
                      disabled
                      className="w-full rounded border px-3 py-2 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.So_dien_thoai}
                      onChange={(e) => setFormData({ ...formData, So_dien_thoai: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Địa chỉ mặc định</label>
                    <input
                      type="text"
                      value={formData.Dia_chi_mac_dinh}
                      onChange={(e) => setFormData({ ...formData, Dia_chi_mac_dinh: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-brand-600 text-white px-6 py-2 hover:bg-brand-700 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && <Orders user={user} />}

            {activeTab === 'addresses' && <AddressManagement user={user} />}

            {activeTab === 'wishlist' && (
              <WishlistTab user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WishlistTab({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const data = await wishlistAPI.getAll();
      setWishlist(data || []);
    } catch (err) {
      console.error('Load wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await wishlistAPI.remove(itemId);
      await loadWishlist();
    } catch (err) {
      alert('Không thể xóa khỏi yêu thích');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Danh sách yêu thích</h2>
      {wishlist.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">Chưa có sản phẩm yêu thích nào</p>
          <button
            onClick={() => navigate('/')}
            className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((item) => (
            <div key={item.ID_Wishlist} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <div
                onClick={() => navigate(`/product/${item.ID_San_pham}`)}
                className="aspect-square bg-gray-100 cursor-pointer"
              >
                <img
                  src={item.Thumbnail || 'https://via.placeholder.com/300'}
                  alt={item.Ten_san_pham}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <div
                  onClick={() => navigate(`/product/${item.ID_San_pham}`)}
                  className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-brand-600 mb-2"
                >
                  {item.Ten_san_pham}
                </div>
                <div className="font-semibold text-brand-600 mb-2">
                  {Number(item.Gia).toLocaleString('vi-VN')}₫
                </div>
                <button
                  onClick={() => handleRemove(item.ID_Wishlist)}
                  className="w-full text-sm text-red-600 hover:underline"
                >
                  Xóa khỏi yêu thích
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

