import React, { useState, useEffect } from 'react';

const FilterSection = ({ title, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (!collapsible) {
    return (
      <div className="py-4 border-b border-gray-200 last:border-0">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">{title}</h3>
        {children}
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-gray-800 hover:text-brand-600 transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
};

const FilterSidebar = ({ categories = [], selectedCategory, minPrice, maxPrice, rating, onFilterChange, onClearFilters }) => {
  const [localMinPrice, setLocalMinPrice] = useState(minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || '');
  const [localRating, setLocalRating] = useState(rating || '');

  useEffect(() => {
    setLocalMinPrice(minPrice || '');
    setLocalMaxPrice(maxPrice || '');
    setLocalRating(rating || '');
  }, [minPrice, maxPrice, rating]);

  const handleCategoryClick = (categoryId) => {
    onFilterChange({
      category: categoryId === selectedCategory ? '' : categoryId,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      rating: localRating,
    });
  };

  const handlePriceApply = () => {
    onFilterChange({
      category: selectedCategory,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      rating: localRating,
    });
  };

  const handleRatingClick = (selectedRating) => {
    const newRating = selectedRating === localRating ? '' : selectedRating;
    setLocalRating(newRating);
    onFilterChange({
      category: selectedCategory,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      rating: newRating,
    });
  };

  const hasActiveFilters = selectedCategory || localMinPrice || localMaxPrice || localRating;

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Bộ lọc</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            Xóa tất cả
          </button>
        )}
      </div>
      
      <FilterSection title="Danh mục" collapsible defaultOpen>
        <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="text-gray-500 text-xs py-2">Đang tải...</div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.ID_Danh_muc}
                onClick={() => handleCategoryClick(cat.ID_Danh_muc)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === String(cat.ID_Danh_muc)
                    ? 'bg-brand-100 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{cat.Ten_danh_muc}</span>
                  {cat.So_luong_san_pham > 0 && (
                    <span className="text-xs text-gray-500">({cat.So_luong_san_pham})</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </FilterSection>

      <FilterSection title="Khoảng giá" collapsible defaultOpen>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Từ"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              min="0"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Đến"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              min="0"
            />
          </div>
          <button
            onClick={handlePriceApply}
            className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </FilterSection>

      <FilterSection title="Đánh giá" collapsible defaultOpen>
        <div className="space-y-2 text-sm">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingClick(String(star))}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                localRating === String(star)
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 fill-current ${
                      i < star ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span>Từ {star} sao trở lên</span>
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
};

export default FilterSidebar;
