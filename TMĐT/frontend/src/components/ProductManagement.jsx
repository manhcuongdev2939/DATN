import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { adminAPI } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";
import DataTable from "./DataTable";
import ProductModal from "./ProductModal";

const ProductManagement = ({ onSummaryRefresh }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
  });
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Debounce utility
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedSearch = useDebounce(filters.search, 500);

  const loadProducts = React.useCallback(
    async (abortSignal) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 20,
          ...filters,
          search: debouncedSearch,
        };
        const { products: prods, meta } = await adminAPI.getProducts(params);
        if (!abortSignal?.aborted) {
          setProducts(Array.isArray(prods) ? prods : []);
          setProductsTotal(meta?.pagination?.total || 0);
        }
      } catch (err) {
        if (!abortSignal?.aborted) {
          toast.error("Không thể tải danh sách sản phẩm");
          setProducts([]);
          setProductsTotal(0);
        }
      } finally {
        if (!abortSignal?.aborted) {
          setLoading(false);
        }
      }
    },
    [page, debouncedSearch, filters.status, filters.category]
  );

  const loadCategories = React.useCallback(async (abortSignal) => {
    try {
      const cats = await adminAPI.getCategories();
      if (!abortSignal?.aborted) {
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch (err) {
      if (!abortSignal?.aborted) {
        setCategories([]);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadProducts(abortController.signal);
    loadCategories(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [loadProducts, loadCategories]);

  const handleProductSave = async (productData) => {
    try {
      const processedData = {
        ...productData,
        Gia: parseFloat(productData.Gia) || 0,
        Gia_goc: productData.Gia_goc ? parseFloat(productData.Gia_goc) : null,
        So_luong_ton_kho: parseInt(productData.So_luong_ton_kho) || 0,
        ID_Danh_muc: parseInt(productData.ID_Danh_muc),
      };

      if (editingProduct?.ID_San_pham) {
        await adminAPI.updateProduct(editingProduct.ID_San_pham, processedData);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await adminAPI.createProduct(processedData);
        toast.success("Thêm sản phẩm thành công");
      }
      setShowProductModal(false);
      setEditingProduct(null);

      const abortController = new AbortController();
      loadProducts(abortController.signal);
      onSummaryRefresh?.();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleProductDelete = async (id) => {
    if (!id || !window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?"))
      return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success("Xóa sản phẩm thành công");
      loadProducts(null);
      setSelectedProducts([]);
      onSummaryRefresh?.();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (!selectedProducts || selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    if (!status) {
      toast.error("Trạng thái không hợp lệ");
      return;
    }

    setBulkUpdating(true);
    try {
      await adminAPI.bulkUpdateProductStatus(selectedProducts, status);
      toast.success(
        `Đã cập nhật trạng thái ${selectedProducts.length} sản phẩm`
      );
      setSelectedProducts([]);
      loadProducts(null);
      onSummaryRefresh?.();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts || selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`
      )
    )
      return;
    try {
      await adminAPI.bulkDeleteProducts(selectedProducts);
      toast.success("Đã xóa sản phẩm thành công");
      setSelectedProducts([]);
      loadProducts(null);
      onSummaryRefresh?.();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleExportProducts = async () => {
    try {
      await adminAPI.exportProducts(filters);
      toast.success("Đã xuất danh sách sản phẩm");
    } catch (err) {
      toast.error(err.message || "Không thể xuất dữ liệu");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipping: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      out_of_stock: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
      returned: "Đã trả hàng",
      active: "Hoạt động",
      inactive: "Ngừng kinh doanh",
      out_of_stock: "Hết hàng",
    };
    return texts[status] || status;
  };

  const productColumns = [
    {
      key: "select",
      header: "",
      render: (product) => (
        <input
          type="checkbox"
          checked={selectedProducts.includes(product.ID_San_pham)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, product.ID_San_pham]);
            } else {
              setSelectedProducts(
                selectedProducts.filter((id) => id !== product.ID_San_pham)
              );
            }
          }}
          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
      ),
      width: "50px",
    },
    {
      key: "product",
      header: "Sản phẩm",
      render: (product) => (
        <div className="flex items-center">
          {product.Thumbnail && (
            <img
              src={product.Thumbnail}
              alt={product.Ten_san_pham}
              className="h-10 w-10 rounded object-cover mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {product.Ten_san_pham}
            </div>
            <div className="text-sm text-gray-500">{product.Ten_danh_muc}</div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Giá",
      render: (product) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(product.Gia)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Tồn kho",
      render: (product) => (
        <span
          className={`text-sm font-medium ${
            product.So_luong_ton_kho < 10 ? "text-red-600" : "text-gray-900"
          }`}
        >
          {product.So_luong_ton_kho}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (product) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            product.Trang_thai
          )}`}
        >
          {getStatusText(product.Trang_thai)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (product) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingProduct(product);
              setShowProductModal(true);
            }}
            className="text-brand-600 hover:text-brand-900"
          >
            Sửa
          </button>
          <button
            onClick={() => handleProductDelete(product.ID_San_pham)}
            className="text-red-600 hover:text-red-900"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Quản lý sản phẩm
        </h2>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <>
              <button
                onClick={() => handleBulkStatusUpdate("active")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={bulkUpdating}
              >
                {bulkUpdating
                  ? `Đang cập nhật (${selectedProducts.length})`
                  : `Kích hoạt (${selectedProducts.length})`}
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("inactive")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                disabled={bulkUpdating}
              >
                {bulkUpdating
                  ? `Đang cập nhật (${selectedProducts.length})`
                  : `Vô hiệu hóa (${selectedProducts.length})`}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa ({selectedProducts.length})
              </button>
            </>
          )}
          <button
            onClick={handleExportProducts}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xuất CSV
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            + Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng kinh doanh</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
          <button
            onClick={() => {
              setFilters({ search: "", status: "", category: "" });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        columns={productColumns}
        data={products}
        loading={loading}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        emptyMessage="Không có sản phẩm nào"
        selectable={true}
        selectedItems={selectedProducts}
        onSelectAll={(checked) => {
          if (checked) {
            setSelectedProducts(products.map((p) => p.ID_San_pham));
          } else {
            setSelectedProducts([]);
          }
        }}
      />

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={handleProductSave}
        />
      )}
    </div>
  );
};

export default ProductManagement;
