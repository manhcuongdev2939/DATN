import React from 'react';
import { adminAPI } from '../../utils/api';

export default function ProductsList() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    adminAPI.getProducts({ page: 1, limit: 50 })
      .then(res => {
        setProducts(res.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sản phẩm</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tên</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Giá</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tồn kho</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => (
                <tr key={p.ID_San_pham || p.id}>
                  <td className="px-4 py-2 text-sm">{p.ID_San_pham}</td>
                  <td className="px-4 py-2 text-sm">{p.Ten_san_pham}</td>
                  <td className="px-4 py-2 text-sm">{Number(p.Gia).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-2 text-sm">{p.So_luong_ton_kho}</td>
                  <td className="px-4 py-2 text-sm">{p.Trang_thai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
