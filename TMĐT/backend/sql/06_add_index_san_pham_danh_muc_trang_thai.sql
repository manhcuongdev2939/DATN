-- Migration: Add composite index to speed up category-product queries
CREATE INDEX IF NOT EXISTS idx_id_danh_muc_trang_thai ON san_pham (ID_Danh_muc, Trang_thai);