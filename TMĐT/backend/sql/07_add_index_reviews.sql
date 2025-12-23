-- Migration: Add composite index to speed up review aggregations
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON danh_gia_phan_hoi (ID_San_pham, Trang_thai);