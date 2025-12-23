import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductListPage from './ProductListPage';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <ProductListPage
      title={query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm sản phẩm'}
      searchQuery={query}
    />
  );
}
