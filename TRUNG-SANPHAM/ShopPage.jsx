import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';

// Import các UI component từ thư viện bạn dùng (shadcn/ui)
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';

export const ShopPage = () => {
  // State lưu thương hiệu đã chọn
  const [selectedBrands, setSelectedBrands] = useState([]);
  // State lưu khoảng giá đang chọn
  const [priceRange, setPriceRange] = useState('all');
  // State lưu cách sắp xếp
  const [sortBy, setSortBy] = useState('featured');

  // Lấy danh sách thương hiệu (loại bỏ trùng lặp)
  const brands = Array.from(new Set(products.map((p) => p.brand)));

  // Hàm bật/tắt chọn thương hiệu
  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand) // Bỏ chọn
        : [...prev, brand] // Thêm chọn
    );
  };

  // Lọc sản phẩm theo thương hiệu & khoảng giá
  const filteredProducts = products.filter((product) => {
    // Nếu có chọn thương hiệu -> chỉ hiển thị các sản phẩm thuộc thương hiệu đó
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
      return false;
    }

    // Lọc theo khoảng giá
    if (priceRange === 'under-15') {
      return product.price < 15000000;
    } else if (priceRange === '15-25') {
      return product.price >= 15000000 && product.price < 25000000;
    } else if (priceRange === 'over-25') {
      return product.price >= 25000000;
    }

    return true; // Mặc định hiển thị tất cả
  });

  // Sắp xếp sản phẩm theo lựa chọn
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Component bộ lọc
  const FilterSection = () => (
    <div className="space-y-6">
      {/* --- Lọc theo thương hiệu --- */}
      <div>
        <h3 className="mb-4">Thương hiệu</h3>
        <div className="space-y-3">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={`brand-${brand}`} className="ml-2 cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* --- Lọc theo khoảng giá --- */}
      <div>
        <h3 className="mb-4">Khoảng giá</h3>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn khoảng giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="under-15">Dưới 15 triệu</SelectItem>
            <SelectItem value="15-25">15 - 25 triệu</SelectItem>
            <SelectItem value="over-25">Trên 25 triệu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --- Nút xóa bộ lọc --- */}
      {(selectedBrands.length > 0 || priceRange !== 'all') && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setSelectedBrands([]);
            setPriceRange('all');
          }}
        >
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );

  // --- Giao diện chính ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* --- Tiêu đề trang --- */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Cửa hàng điện thoại</h1>
          <p className="text-gray-600">
            Tìm thấy {sortedProducts.length} sản phẩm
          </p>
        </div>

        <div className="flex gap-8">
          {/* --- Bộ lọc cho màn hình lớn (desktop) --- */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-6">
                <FilterSection />
              </CardContent>
            </Card>
          </aside>

          {/* --- Danh sách sản phẩm --- */}
          <div className="flex-1">
            {/* --- Thanh công cụ (bộ lọc + sắp xếp) --- */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* --- Bộ lọc cho mobile --- */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Bộ lọc
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSection />
                  </div>
                </SheetContent>
              </Sheet>

              {/* --- Chọn cách sắp xếp --- */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">Sắp xếp:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Nổi bật</SelectItem>
                    <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                    <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                    <SelectItem value="name">Tên A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* --- Lưới sản phẩm --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="relative">
                        {/* Badge hiển thị "Mới" */}
                        {product.isNew && (
                          <Badge className="absolute top-2 left-2 bg-green-600 z-10">
                            Mới
                          </Badge>
                        )}

                        {/* Badge hiển thị % giảm giá */}
                        {product.originalPrice && (
                          <Badge className="absolute top-2 right-2 bg-red-600 z-10">
                            Giảm{' '}
                            {Math.round(
                              (1 - product.price / product.originalPrice) * 100
                            )}
                            %
                          </Badge>
                        )}

                        {/* Hình ảnh sản phẩm */}
                        <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Tên, thương hiệu, giá, đánh giá */}
                      <Badge className="mb-2">{product.brand}</Badge>
                      <h3 className="mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span className="text-yellow-500">★</span>
                        <span>{product.rating}</span>
                        <span>({product.reviews})</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* --- Thông báo khi không có sản phẩm --- */}
            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
