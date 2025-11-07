-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category ENUM('laptop','phone') NOT NULL,
  country VARCHAR(120) DEFAULT NULL,
  logo_url VARCHAR(512) DEFAULT NULL,
  UNIQUE KEY uq_brand_name_category (name, category)
);

-- Laptop brands
INSERT IGNORE INTO brands (name, category, country) VALUES
('Apple', 'laptop', 'USA'),
('Dell', 'laptop', 'USA'),
('HP', 'laptop', 'USA'),
('Lenovo', 'laptop', 'China'),
('Asus', 'laptop', 'Taiwan'),
('Acer', 'laptop', 'Taiwan'),
('MSI', 'laptop', 'Taiwan'),
('Razer', 'laptop', 'USA'),
('Microsoft', 'laptop', 'USA'),
('LG', 'laptop', 'South Korea');

-- Phone brands
INSERT IGNORE INTO brands (name, category, country) VALUES
('Apple', 'phone', 'USA'),
('Samsung', 'phone', 'South Korea'),
('Xiaomi', 'phone', 'China'),
('OPPO', 'phone', 'China'),
('vivo', 'phone', 'China'),
('Realme', 'phone', 'China'),
('OnePlus', 'phone', 'China'),
('Google', 'phone', 'USA'),
('Nokia', 'phone', 'Finland'),
('Huawei', 'phone', 'China');


