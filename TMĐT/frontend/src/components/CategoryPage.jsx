import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { categoriesAPI } from '../utils/api';

function CategoryPage() {
    const { id } = useParams();
    const [category, setCategory] = React.useState(null);
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                setLoading(true);
                const [cat, prods] = await Promise.all([
                    categoriesAPI.getById(id),
                    categoriesAPI.getProducts(id),
                ]);
                setCategory(cat);
                setProducts(prods);
            } catch (err) {
                toast.error('Không thể tải dữ liệu danh mục. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [id]);

    if (loading) {
        return <div className="text-center py-10">Đang tải...</div>;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {category?.Ten_danh_muc || 'Danh mục'}
            </h1>

            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg">
                <p className="font-semibold">Cam kết chất lượng</p>
                <p className="text-sm">Tất cả sản phẩm trong danh mục này đều là hàng chính hãng, đã được kiểm duyệt.</p>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.map((p) => (
                        <div key={p.ID_San_pham} className="rounded-xl bg-white border hover:shadow-lg transition group">
                            <div className="aspect-square rounded-t-xl bg-gray-100 overflow-hidden">
                                {p.Thumbnail ? (
                                    <img src={p.Thumbnail} alt={p.Ten_san_pham} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : <div className="h-full w-full bg-gray-200"></div>}
                            </div>
                            <div className="p-4">
                                <div className="text-sm text-gray-500">{category?.Ten_danh_muc}</div>
                                <Link to={`/product/${p.ID_San_pham}`} className="mt-1 font-medium line-clamp-2 hover:text-brand-600">
                                    {p.Ten_san_pham}
                                </Link>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="font-semibold text-brand-700">{Number(p.Gia).toLocaleString('vi-VN')}₫</span>
                                    <span className="flex items-center text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Uy tín
                                    </span>
                                </div>
                                <Link to={`/product/${p.ID_San_pham}`} className="mt-3 w-full block text-center rounded bg-brand-600 text-white py-2 text-sm hover:bg-brand-700">
                                    Xem chi tiết
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>Không có sản phẩm nào trong danh mục này.</p>
            )}
        </div>
    );
}

export default CategoryPage;
