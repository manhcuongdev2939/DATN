import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressesAPI } from '../utils/api';

export default function AddressManagement({ user, onClose, onSelect }) {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    Ten_nguoi_nhan: '',
    So_dien_thoai: '',
    Dia_chi: '',
    Phuong_Xa: '',
    Quan_Huyen: '',
    Tinh_Thanh: '',
    Mac_dinh: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressesAPI.getAll();
      setAddresses(data);
    } catch (err) {
      setError('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await addressesAPI.update(editingId, formData);
      } else {
        await addressesAPI.create(formData);
      }
      await loadAddresses();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        Ten_nguoi_nhan: '',
        So_dien_thoai: '',
        Dia_chi: '',
        Phuong_Xa: '',
        Quan_Huyen: '',
        Tinh_Thanh: '',
        Mac_dinh: false,
      });
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (address) => {
    setFormData({
      Ten_nguoi_nhan: address.Ten_nguoi_nhan,
      So_dien_thoai: address.So_dien_thoai,
      Dia_chi: address.Dia_chi,
      Phuong_Xa: address.Phuong_Xa || '',
      Quan_Huyen: address.Quan_Huyen || '',
      Tinh_Thanh: address.Tinh_Thanh,
      Mac_dinh: address.Mac_dinh || false,
    });
    setEditingId(address.ID_Dia_chi);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    try {
      await addressesAPI.delete(id);
      await loadAddresses();
    } catch (err) {
      alert('Không thể xóa địa chỉ');
    }
  };

  const handleSelect = (address) => {
    if (onSelect) {
      onSelect(address.ID_Dia_chi);
    }
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Quản lý địa chỉ</h1>
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Đóng
              </button>
            )}
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  Ten_nguoi_nhan: '',
                  So_dien_thoai: '',
                  Dia_chi: '',
                  Phuong_Xa: '',
                  Quan_Huyen: '',
                  Tinh_Thanh: '',
                  Mac_dinh: false,
                });
              }}
              className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
            >
              + Thêm địa chỉ mới
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">{error}</div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên người nhận *</label>
                <input
                  type="text"
                  required
                  value={formData.Ten_nguoi_nhan}
                  onChange={(e) => setFormData({ ...formData, Ten_nguoi_nhan: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={formData.So_dien_thoai}
                  onChange={(e) => setFormData({ ...formData, So_dien_thoai: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ *</label>
                <input
                  type="text"
                  required
                  value={formData.Dia_chi}
                  onChange={(e) => setFormData({ ...formData, Dia_chi: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Số nhà, tên đường"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phường/Xã</label>
                  <input
                    type="text"
                    value={formData.Phuong_Xa}
                    onChange={(e) => setFormData({ ...formData, Phuong_Xa: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
                  <input
                    type="text"
                    value={formData.Quan_Huyen}
                    onChange={(e) => setFormData({ ...formData, Quan_Huyen: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố *</label>
                  <input
                    type="text"
                    required
                    value={formData.Tinh_Thanh}
                    onChange={(e) => setFormData({ ...formData, Tinh_Thanh: e.target.value })}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mac_dinh"
                  checked={formData.Mac_dinh}
                  onChange={(e) => setFormData({ ...formData, Mac_dinh: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="mac_dinh" className="text-sm">Đặt làm địa chỉ mặc định</label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
                >
                  {editingId ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Chưa có địa chỉ nào. Hãy thêm địa chỉ mới.
            </div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.ID_Dia_chi} className="bg-white rounded-lg p-6 border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {addr.Mac_dinh && (
                      <span className="inline-block mb-2 text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">
                        Mặc định
                      </span>
                    )}
                    <div className="font-medium text-lg mb-1">{addr.Ten_nguoi_nhan}</div>
                    <div className="text-gray-600 mb-1">{addr.So_dien_thoai}</div>
                    <div className="text-gray-600">
                      {addr.Dia_chi}
                      {addr.Phuong_Xa && `, ${addr.Phuong_Xa}`}
                      {addr.Quan_Huyen && `, ${addr.Quan_Huyen}`}
                      {`, ${addr.Tinh_Thanh}`}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {onSelect && (
                      <button
                        onClick={() => handleSelect(addr)}
                        className="text-brand-600 hover:underline text-sm"
                      >
                        Chọn
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(addr)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(addr.ID_Dia_chi)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

