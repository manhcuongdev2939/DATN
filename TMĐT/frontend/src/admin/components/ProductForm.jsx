import React, { useState, useEffect } from 'react';
import { adminAPI, categoriesAPI } from '../../utils/api';

const DEFAULT_FORM_DATA = {
  Ten_san_pham: '',
  Mo_ta: '',
  Gia: '',
  Gia_goc: '',
  So_luong_ton_kho: '',
  ID_Danh_muc: '',
  Trang_thai: 'active',
  Thumbnail: '', // Optional: can be extended for file uploads
};

export default function ProductForm({ product, onSave, onClose }) {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Populate form if we are editing an existing product
    if (product) {
      setFormData({
        Ten_san_pham: product.Ten_san_pham || '',
        Mo_ta: product.Mo_ta || '',
        Gia: product.Gia || '',
        Gia_goc: product.Gia_goc || '',
        So_luong_ton_kho: product.So_luong_ton_kho || '',
        ID_Danh_muc: product.ID_Danh_muc || '',
        Trang_thai: product.Trang_thai || 'active',
        Thumbnail: product.Thumbnail || '',
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [product]);

  useEffect(() => {
    // Fetch categories for the dropdown
    categoriesAPI.getAll()
      .then(setCategories)
      .catch(() => setError('Không thể tải danh mục sản phẩm.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic Validation
    if (!formData.Ten_san_pham || !formData.Gia || !formData.So_luong_ton_kho || !formData.ID_Danh_muc) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (product) {
        // Update existing product
        await adminAPI.updateProduct(product.ID_San_pham, formData);
      } else {
        // Create new product
        await adminAPI.createProduct(formData);
      }
      onSave(); // Refresh the list in the parent component
      onClose(); // Close the form
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold mb-6 text-gray-800">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
          
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tên sản phẩm */}
            <div className="md:col-span-2">
              <label htmlFor="Ten_san_pham" className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
              <input
                type="text"
                name="Ten_san_pham"
                id="Ten_san_pham"
                value={formData.Ten_san_pham}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Danh mục */}
            <div>
              <label htmlFor="ID_Danh_muc" className="block text-sm font-medium text-gray-700">Danh mục</label>
              <select
                name="ID_Danh_muc"
                id="ID_Danh_muc"
                value={formData.ID_Danh_muc}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(cat => (
                  <option key={cat.ID_Danh_muc} value={cat.ID_Danh_muc}>{cat.Ten_danh_muc}</option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <label htmlFor="Trang_thai" className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                name="Trang_thai"
                id="Trang_thai"
                value={formData.Trang_thai}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            {/* Giá */}
            <div>
              <label htmlFor="Gia" className="block text-sm font-medium text-gray-700">Giá bán</label>
              <input
                type="number"
                name="Gia"
                id="Gia"
                value={formData.Gia}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            {/* Giá gốc */}
            <div>
              <label htmlFor="Gia_goc" className="block text-sm font-medium text-gray-700">Giá gốc (Tùy chọn)</label>
              <input
                type="number"
                name="Gia_goc"
                id="Gia_goc"
                value={formData.Gia_goc}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Tồn kho */}
            <div className="md:col-span-2">
              <label htmlFor="So_luong_ton_kho" className="block text-sm font-medium text-gray-700">Số lượng tồn kho</label>
              <input
                type="number"
                name="So_luong_ton_kho"
                id="So_luong_ton_kho"
                value={formData.So_luong_ton_kho}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label htmlFor="Mo_ta" className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                name="Mo_ta"
                id="Mo_ta"
                value={formData.Mo_ta}
                onChange={handleChange}
                rows="4"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
