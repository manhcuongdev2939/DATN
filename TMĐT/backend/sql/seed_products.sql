-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  brand VARCHAR(100) NOT NULL,
  image_url VARCHAR(512) DEFAULT NULL,
  category VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample products (phones)
INSERT INTO products (name, price, brand, category) VALUES
('iPhone 15', 22990000, 'Apple', 'phone'),
('iPhone 15 Pro', 28990000, 'Apple', 'phone'),
('Galaxy S24', 19990000, 'Samsung', 'phone'),
('Galaxy S24 Ultra', 28990000, 'Samsung', 'phone'),
('Xiaomi 14', 15990000, 'Xiaomi', 'phone'),
('Xiaomi 14 Pro', 21990000, 'Xiaomi', 'phone'),
('OPPO Reno 12', 10990000, 'OPPO', 'phone'),
('OPPO Find X7', 18990000, 'OPPO', 'phone'),
('vivo X100', 16990000, 'vivo', 'phone'),
('Realme GT 6', 12990000, 'Realme', 'phone');

-- Sample products (laptops)
INSERT INTO products (name, price, brand, category) VALUES
('MacBook Air M2', 24990000, 'Apple', 'laptop'),
('MacBook Pro M3', 44990000, 'Apple', 'laptop'),
('Dell XPS 13', 28990000, 'Dell', 'laptop'),
('Dell Inspiron 15', 17990000, 'Dell', 'laptop'),
('HP Spectre x360', 27990000, 'HP', 'laptop'),
('HP Pavilion 15', 14990000, 'HP', 'laptop'),
('Asus ZenBook 14', 20990000, 'Asus', 'laptop'),
('Asus ROG Strix G16', 34990000, 'Asus', 'laptop'),
('Lenovo ThinkPad X1', 31990000, 'Lenovo', 'laptop'),
('Lenovo Yoga 9i', 26990000, 'Lenovo', 'laptop');


