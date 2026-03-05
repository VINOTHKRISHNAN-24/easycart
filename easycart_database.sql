-- ============================================================
--  EasyCart Database Schema + Seed Data
--  MySQL 8.0+
--  Run: mysql -u root -p < easycart_database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS easycart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE easycart;

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  phone      VARCHAR(20),
  password   VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10)
);

INSERT INTO categories (name, icon) VALUES
  ('Mobiles',         '📱'),
  ('Home Appliances', '🏠'),
  ('Electronics',     '⚡'),
  ('Fashion',         '👗'),
  ('Kitchen',         '🍽️')
ON DUPLICATE KEY UPDATE icon = VALUES(icon);

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT           DEFAULT 0,
  image_emoji VARCHAR(10)   DEFAULT '📦',
  category_id INT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

INSERT INTO products (name, description, price, stock, image_emoji, category_id) VALUES
-- Mobiles (category 1)
('Samsung Galaxy S24',          '6.2" Dynamic AMOLED, 50MP camera, 5000mAh battery, Snapdragon 8 Gen 3.',       74999.00, 10, '📱', 1),
('Redmi Note 13 Pro',           '200MP camera, 67W fast charging, 5G enabled, 6.67" AMOLED display.',           24999.00, 18, '📱', 1),
('iPhone 15',                   'A16 Bionic chip, 48MP main camera, Dynamic Island, USB-C charging.',           79999.00,  6, '📱', 1),
('OnePlus 12R',                 'Snapdragon 8 Gen 2, 100W SuperVOOC, 6.78" fluid AMOLED display.',              39999.00, 14, '📱', 1),
-- Home Appliances (category 2)
('LG 1.5 Ton Split AC',         '5-star inverter with auto-clean and WiFi control feature.',                     38999.00,  7, '❄️', 2),
('Samsung 7kg Washing Machine', 'Fully automatic front load with EcoBubble technology.',                         28999.00,  9, '🫧', 2),
('Voltas 245L Refrigerator',    'Frost-free double door, 3-star energy rating.',                                 22999.00, 11, '🧊', 2),
('Bajaj Mixer Grinder',         '750W motor, 3 stainless steel jars, ISI certified.',                            2499.00, 25, '🌀', 2),
-- Electronics (category 3)
('boAt Rockerz 550',            '40hr battery life, Bluetooth 5.0, immersive deep bass.',                        1799.00, 30, '🎧', 3),
('Mi 43" Smart TV',             '4K UHD, Android TV 11, Dolby Audio, Chromecast built-in.',                     29999.00,  8, '📺', 3),
('Lenovo IdeaPad Slim 3',       'Intel i5 12th Gen, 8GB RAM, 512GB SSD, 15.6" FHD display.',                   44999.00, 12, '💻', 3),
('Canon EOS 1500D DSLR',        '24.1MP sensor, 18-55mm kit lens, Full HD video recording.',                    34999.00,  5, '📷', 3),
-- Fashion (category 4)
("Levi's 511 Slim Jeans",       'Classic slim fit, stretchable denim, comfort waistband.',                       2999.00, 40, '👖', 4),
('Nike Air Max 270',            'Max Air heel unit, breathable mesh upper, foam midsole.',                      12995.00, 20, '👟', 4),
('Titan Analog Watch',          'Water resistant, sapphire crystal glass, genuine leather strap.',               3995.00, 16, '⌚', 4),
-- Kitchen (category 5)
('Prestige Pressure Cooker 5L', 'Hard anodised aluminium, ISI certified, 5 litre capacity.',                    1299.00, 35, '🍲', 5),
('Pigeon Non-Stick Tawa',       'PFOA free coating, thick base, induction compatible.',                           699.00, 50, '🍳', 5),
('Butterfly 3 Burner Gas Stove','Stainless steel body, auto-ignition, forged brass burners, ISI mark.',          4299.00, 15, '🔥', 5);

-- ── RATINGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT     NOT NULL,
  product_id INT     NOT NULL,
  stars      TINYINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rating (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── CART ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  qty        INT DEFAULT 1,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_item (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status       ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'confirmed',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT,
  qty        INT           NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ── HELPFUL VIEW ─────────────────────────────────────────────
CREATE OR REPLACE VIEW products_view AS
SELECT
  p.id, p.name, p.description, p.price, p.stock, p.image_emoji,
  c.name                                AS category,
  c.icon                                AS category_icon,
  ROUND(COALESCE(AVG(r.stars), 0), 1)  AS avg_rating,
  COUNT(r.id)                           AS rating_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN ratings    r ON p.id = r.product_id
GROUP BY p.id, p.name, p.description, p.price, p.stock, p.image_emoji, c.name, c.icon;

SELECT 'EasyCart database created successfully! ✅' AS status;
