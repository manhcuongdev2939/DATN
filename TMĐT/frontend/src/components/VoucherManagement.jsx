import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { adminAPI } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";

// A modal for creating/editing vouchers
function VoucherModal({ voucher, onClose, onSave }) {
  const [formData, setFormData] = useState({
    Ma_voucher: voucher?.Ma_voucher || "",
    Loai_giam_gia: voucher?.Loai_giam_gia || "percentage",
    Gia_tri_giam: voucher?.Gia_tri_giam || "",
    Don_hang_toi_thieu: voucher?.Don_hang_toi_thieu || "",
    So_luong: voucher?.So_luong || "",
    Ngay_bat_dau: voucher?.Ngay_bat_dau
      ? new Date(voucher.Ngay_bat_dau).toISOString().split("T")[0]
      : "",
    Ngay_ket_thuc: voucher?.Ngay_ket_thuc
      ? new Date(voucher.Ngay_ket_thuc).toISOString().split("T")[0]
      : "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {voucher ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Mã voucher (ví dụ: SALE10)"
            required
            value={formData.Ma_voucher}
            onChange={(e) =>
              setFormData({ ...formData, Ma_voucher: e.target.value.toUpperCase() })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.Loai_giam_gia}
              onChange={(e) =>
                setFormData({ ...formData, Loai_giam_gia: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="percentage">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (VND)</option>
            </select>
            <input
              type="number"
              placeholder="Giá trị giảm"
              required
              min="0"
              value={formData.Gia_tri_giam}
              onChange={(e) =>
                setFormData({ ...formData, Gia_tri_giam: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
           <input
            type="number"
            placeholder="Đơn hàng tối thiểu (VND)"
            required
            min="0"
            value={formData.Don_hang_toi_thieu}
            onChange={(e) =>
              setFormData({ ...formData, Don_hang_toi_thieu: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Số lượng mã"
            required
            min="0"
            value={formData.So_luong}
            onChange={(e) =>
              setFormData({ ...formData, So_luong: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-sm">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={formData.Ngay_bat_dau}
                onChange={(e) =>
                  setFormData({ ...formData, Ngay_bat_dau: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm">Ngày kết thúc</label>
              <input
                type="date"
                required
                value={formData.Ngay_ket_thuc}
                onChange={(e) =>
                  setFormData({ ...formData, Ngay_ket_thuc: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);
  
  const handleSave = async (voucherData) => {
    try {
      if (editingVoucher) {
        await adminAPI.updateVoucher(editingVoucher.ID_Voucher, voucherData);
        toast.success("Cập nhật mã giảm giá thành công!");
      } else {
        await adminAPI.createVoucher(voucherData);
        toast.success("Tạo mã giảm giá mới thành công!");
      }
      setShowModal(false);
      setEditingVoucher(null);
      await loadVouchers();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const handleDelete = async (voucherId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;
    try {
      await adminAPI.deleteVoucher(voucherId);
      toast.success("Xóa mã giảm giá thành công!");
      await loadVouchers();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };
  
  const getStatus = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.Ngay_bat_dau);
    const endDate = new Date(voucher.Ngay_ket_thuc);
    endDate.setHours(23, 59, 59, 999); // End of day

    if (voucher.So_luong_da_su_dung >= voucher.So_luong) {
      return { text: "Hết lượt", color: "text-gray-500" };
    }
    if (now < startDate) {
      return { text: "Sắp diễn ra", color: "text-blue-500" };
    }
    if (now > endDate) {
      return { text: "Đã hết hạn", color: "text-red-500" };
    }
    return { text: "Đang hoạt động", color: "text-green-500" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Quản lý Mã giảm giá
        </h2>
        <button
          onClick={() => {
            setEditingVoucher(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          + Tạo mã mới
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn tối thiểu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã dùng / Tổng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày hiệu lực</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Chưa có mã giảm giá nào.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const status = getStatus(v);
                  return (
                    <tr key={v.ID_Voucher} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">{v.Ma_voucher}</td>
                      <td className="px-6 py-4">
                        {v.Loai_giam_gia === 'fixed'
                          ? formatCurrency(v.Gia_tri_giam)
                          : `${v.Gia_tri_giam}%`}
                      </td>
                       <td className="px-6 py-4">{formatCurrency(v.Don_hang_toi_thieu)}</td>
                      <td className="px-6 py-4">{`${v.So_luong_da_su_dung} / ${v.So_luong}`}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(v.Ngay_bat_dau).toLocaleDateString("vi-VN")} - {new Date(v.Ngay_ket_thuc).toLocaleDateString("vi-VN")}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${status.color}`}>{status.text}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingVoucher(v);
                            setShowModal(true);
                          }}
                          className="text-brand-600 hover:text-brand-900 mr-4"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(v.ID_Voucher)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <VoucherModal
          voucher={editingVoucher}
          onClose={() => {
            setShowModal(false);
            setEditingVoucher(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
