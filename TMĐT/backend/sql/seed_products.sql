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
INSERT INTO products (name, price, brand, image_url, category) VALUES
('iPhone 15', 22990000, 'Apple', NULL, 'phone'),
('iPhone 15 Pro', 28990000, 'Apple', NULL, 'phone'),
('Galaxy S24', 19990000, 'Samsung', NULL, 'phone'),
('Xiaomi 14', 15990000, 'Xiaomi', NULL, 'phone'),
('OPPO Reno 12', 10990000, 'OPPO', NULL, 'phone');

-- Sample products (laptops)
INSERT INTO products (name, price, brand, image_url, category) VALUES
('MacBook Air M2', 24990000, 'Apple', NULL, 'laptop'),
('Dell XPS 13', 28990000, 'Dell', NULL, 'laptop'),
('HP Spectre x360', 27990000, 'HP', NULL, 'laptop'),
('Asus ZenBook 14', 20990000, 'Asus', NULL, 'laptop'),
('Lenovo ThinkPad X1', 31990000, 'Lenovo', NULL, 'laptop');


