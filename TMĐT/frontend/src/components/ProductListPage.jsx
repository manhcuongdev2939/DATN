import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';
import { productsAPI, categoriesAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const ProductListPage = ({ title: initialTitle, products: initialProducts, loading: initialLoading, categoryId, searchQuery }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(initialLoading !== undefined ? initialLoading : false);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  
  // Filter/Sort state from URL params
  const currentCategory = searchParams.get('category') || categoryId || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentRating = searchParams.get('rating') || '';
  const currentSort = searchParams.get('sort') || 'Ngay_tao';
  const currentOrder = searchParams.get('order') || 'DESC';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentSearch = searchParams.get('q') || searchQuery || '';

  // Load categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load products when filters/sort change
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
      };

      if (currentCategory) params.category = currentCategory;
      if (currentMinPrice) params.minPrice = currentMinPrice;
      if (currentMaxPrice) params.maxPrice = currentMaxPrice;
      if (currentSearch) params.search = currentSearch;
      if (currentSort) params.sort = currentSort;
      if (currentOrder) params.order = currentOrder;

      const result = await productsAPI.getAll(params);
      setProducts(result.products || []);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentMinPrice, currentMaxPrice, currentSearch, currentSort, currentOrder, currentPage]);

  // Load products if not provided as props or when filters change
  useEffect(() => {
    if (initialProducts === undefined) {
      loadProducts();
    } else {
      setProducts(initialProducts);
      setLoading(initialLoading);
    }
  }, [loadProducts, initialProducts, initialLoading]);

  const handleFilterChange = (newFilters) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Reset to page 1 when filters change
    newParams.set('page', '1');
    
    if (newFilters.category) {
      newParams.set('category', newFilters.category);
    } else {
      newParams.delete('category');
    }
    
    if (newFilters.minPrice) {
      newParams.set('minPrice', newFilters.minPrice);
    } else {
      newParams.delete('minPrice');
    }
    
    if (newFilters.maxPrice) {
      newParams.set('maxPrice', newFilters.maxPrice);
    } else {
      newParams.delete('maxPrice');
    }
    
    if (newFilters.rating) {
      newParams.set('rating', newFilters.rating);
    } else {
      newParams.delete('rating');
    }
    
    setSearchParams(newParams);
  };

  const handleSortChange = (sort, order) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    newParams.set('order', order);
    newParams.set('page', '1'); // Reset to page 1
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    if (currentSearch) newParams.set('q', currentSearch);
    if (categoryId) newParams.set('category', categoryId);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const title = initialTitle || (currentSearch ? `Kết quả tìm kiếm cho "${currentSearch}"` : 'Sản phẩm');

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Filters (Left Column) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <FilterSidebar
                categories={categories}
                selectedCategory={currentCategory}
                minPrice={currentMinPrice}
                maxPrice={currentMaxPrice}
                rating={currentRating}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Products (Right Column) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {products.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {pagination?.total || products.length} sản phẩm
                  </span>
                )}
              </div>
              
              {loading ? (
                <LoadingSpinner text="Đang tải sản phẩm..." />
              ) : (
                <ProductGrid
                  products={products}
                  sort={currentSort}
                  order={currentOrder}
                  onSortChange={handleSortChange}
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
