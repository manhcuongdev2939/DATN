-- Migration: Add role column to khach_hang to support role-based auth
-- This migration is written to be compatible with MySQL versions that do not support
-- IF NOT EXISTS in ALTER TABLE. It conditionally adds the column and index using
-- a short stored procedure that checks information_schema first.

DELIMITER $$
CREATE PROCEDURE add_vai_tro_if_missing()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'khach_hang'
      AND column_name = 'Vai_tro'
  ) THEN
    ALTER TABLE khach_hang
      ADD COLUMN Vai_tro ENUM('customer','admin','super_admin') NOT NULL DEFAULT 'customer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'khach_hang'
      AND index_name = 'idx_vai_tro'
  ) THEN
    CREATE INDEX idx_vai_tro ON khach_hang (Vai_tro);
  END IF;
END$$
$$
CALL add_vai_tro_if_missing();
DROP PROCEDURE add_vai_tro_if_missing;
DELIMITER ;