import React from 'react';
import { Link } from 'react-router-dom';

const SortButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
      active
        ? 'bg-brand-600 text-white shadow-sm'
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
    }`}
  >
    {children}
  </button>
);

const ProductGrid = ({ products, sort = 'Ngay_tao', order = 'DESC', onSortChange, pagination, currentPage = 1, onPageChange }) => {
  if (!products) {
    return null;
  }

  const handleSort = (newSort, newOrder) => {
    if (onSortChange) {
      onSortChange(newSort, newOrder);
    }
  };

  const getSortLabel = () => {
    if (sort === 'Ngay_tao' && order === 'DESC') return 'Mới nhất';
    if (sort === 'Gia' && order === 'ASC') return 'Giá: Thấp → Cao';
    if (sort === 'Gia' && order === 'DESC') return 'Giá: Cao → Thấp';
    if (sort === 'Diem_trung_binh' && order === 'DESC') return 'Đánh giá cao';
    if (sort === 'Ten_san_pham' && order === 'ASC') return 'Tên A-Z';
    return 'Sắp xếp';
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const totalPages = pagination.totalPages;
    const maxVisible = 7;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="mt-8 flex justify-center">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange && onPageChange(1)}
                className="px-3 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange && onPageChange(page)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                page === currentPage
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
              <button
                onClick={() => onPageChange && onPageChange(totalPages)}
                className="px-3 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div>
      {/* Sorting Header */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <span className="text-sm font-semibold text-gray-700">Sắp xếp theo</span>
        <div className="flex flex-wrap items-center gap-2">
          <SortButton
            active={sort === 'Ngay_tao' && order === 'DESC'}
            onClick={() => handleSort('Ngay_tao', 'DESC')}
          >
            Mới nhất
          </SortButton>
          <SortButton
            active={sort === 'Diem_trung_binh' && order === 'DESC'}
            onClick={() => handleSort('Diem_trung_binh', 'DESC')}
          >
            Đánh giá cao
          </SortButton>
          <SortButton
            active={sort === 'Gia' && order === 'ASC'}
            onClick={() => handleSort('Gia', 'ASC')}
          >
            Giá: Thấp → Cao
          </SortButton>
          <SortButton
            active={sort === 'Gia' && order === 'DESC'}
            onClick={() => handleSort('Gia', 'DESC')}
          >
            Giá: Cao → Thấp
          </SortButton>
          <SortButton
            active={sort === 'Ten_san_pham' && order === 'ASC'}
            onClick={() => handleSort('Ten_san_pham', 'ASC')}
          >
            Tên A-Z
          </SortButton>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-600 text-lg font-medium">Không tìm thấy sản phẩm phù hợp</p>
          <p className="text-gray-500 text-sm mt-2">Thử điều chỉnh bộ lọc của bạn</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const product = {
                id: p.ID_San_pham || p.id,
                name: p.Ten_san_pham || p.name,
                price: p.Gia || p.price,
                image_url: p.Thumbnail || p.image_url,
                originalPrice: p.Gia_goc || p.originalPrice,
                rating: p.Diem_trung_binh || 0,
                reviewCount: p.So_luong_danh_gia || 0,
              };

              const discountPercent =
                product.originalPrice && Number(product.originalPrice) > Number(product.price)
                  ? Math.min(99, Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100))
                  : 0;

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group bg-white rounded-lg border border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm">
                        -{discountPercent}%
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-grow flex flex-col">
                    <p className="text-sm text-gray-800 line-clamp-2 flex-grow mb-2 min-h-[2.5rem]">
                      {product.name}
                    </p>
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 fill-current ${
                                i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">({product.reviewCount})</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                          <div className="text-xs text-gray-500 line-through mb-1">
                            {Number(product.originalPrice).toLocaleString('vi-VN')}₫
                          </div>
                        )}
                        <div className="text-base font-bold text-brand-600">
                          {Number(product.price).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
