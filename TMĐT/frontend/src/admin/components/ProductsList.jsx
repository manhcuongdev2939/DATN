import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import ProductForm from './ProductForm'; 

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    adminAPI.getProducts({ page: 1, limit: 100 })
      .then(res => {
        setProducts(res.products || []);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Không thể tải danh sách sản phẩm.');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await adminAPI.deleteProduct(productId);
        fetchProducts(); // Refresh list after delete
      } catch (err) {
        alert('Lỗi khi xóa sản phẩm: ' + err.message);
      }
    }
  };

  const handleOpenForm = (product = null) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const handleSave = () => {
    fetchProducts(); // Refresh list after saving
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Quản lý Sản phẩm</h2>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {loading && <div>Đang tải...</div>}
      {error && <div className="text-red-500">Lỗi: {error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => (
                <tr key={p.ID_San_pham}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.ID_San_pham}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.Ten_san_pham}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{Number(p.Gia).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.So_luong_ton_kho}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      p.Trang_thai === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {p.Trang_thai}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenForm(p)} className="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button>
                    <button onClick={() => handleDelete(p.ID_San_pham)} className="text-red-600 hover:text-red-900">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <ProductForm 
          product={selectedProduct}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
