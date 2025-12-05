import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoriesAPI } from '../utils/api';

function CategoryPage() {
    const { id } = useParams();
    const [category, setCategory] = React.useState(null);
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                setLoading(true);
                setError('');
                const [cat, prods] = await Promise.all([
                    categoriesAPI.getById(id),
                    categoriesAPI.getProducts(id),
                ]);
                setCategory(cat);
                setProducts(prods);
            } catch (err) {
                setError('Không thể tải dữ liệu danh mục. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [id]);

    if (loading) {
        return <div className="text-center py-10">Đang tải...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {category?.Ten_danh_muc || 'Danh mục'}
            </h1>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.map((p) => (
                        <div key={p.ID_San_pham} className="rounded-xl bg-white border hover:shadow-lg transition">
                            <div className="aspect-square rounded-t-xl bg-gray-100 overflow-hidden">
                                {p.Thumbnail ? (
                                    <img src={p.Thumbnail} alt={p.Ten_san_pham} className="h-full w-full object-cover" />
                                ) : null}
                            </div>
                            <div className="p-4">
                                <div className="text-sm text-gray-500">{category?.Ten_danh_muc}</div>
                                <Link to={`/product/${p.ID_San_pham}`} className="mt-1 font-medium line-clamp-2 hover:text-brand-600">
                                    {p.Ten_san_pham}
                                </Link>
                                <div className="mt-2 font-semibold text-brand-700">{Number(p.Gia).toLocaleString('vi-VN')}₫</div>
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
