const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const mysql   = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ── DB Pool ───────────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'easycart',
  waitForConnections: true,
  connectionLimit: 10,
});
db.getConnection()
  .then(c => { console.log('✅ MySQL connected'); c.release(); })
  .catch(e => { console.error('❌ MySQL failed:', e.message); process.exit(1); });

const SECRET = process.env.JWT_SECRET || 'dev_secret';

// ── JWT Middleware ────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(h.split(' ')[1], SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password required' });
    const [ex] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (ex.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users(name,email,phone,password) VALUES(?,?,?,?)',
      [name, email, phone || null, hash]
    );
    const token = jwt.sign({ id: r.insertId, name, email }, SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: r.insertId, name, email, phone } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const u = rows[0];
    if (!await bcrypt.compare(password, u.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: u.id, name: u.name, email: u.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, name: u.name, email: u.email, phone: u.phone } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const [r] = await db.query(
    'SELECT id,name,email,phone,created_at FROM users WHERE id=?', [req.user.id]
  );
  r.length ? res.json(r[0]) : res.status(404).json({ error: 'Not found' });
});

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
app.get('/api/categories', async (req, res) => {
  const [r] = await db.query('SELECT * FROM categories ORDER BY name');
  res.json(r);
});

// ════════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════════
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let q = `
      SELECT p.id, p.name, p.description, p.price, p.stock, p.image_emoji,
        c.name AS category, c.icon AS category_icon,
        ROUND(COALESCE(AVG(r.stars),0),1) AS avg_rating,
        COUNT(r.id) AS rating_count
      FROM products p
      LEFT JOIN categories c ON p.category_id=c.id
      LEFT JOIN ratings r ON p.id=r.product_id
      WHERE 1=1`;
    const p = [];
    if (category && category !== 'All') { q += ' AND c.name=?'; p.push(category); }
    if (search) {
      q += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      p.push(`%${search}%`, `%${search}%`);
    }
    q += ' GROUP BY p.id,p.name,p.description,p.price,p.stock,p.image_emoji,c.name,c.icon';
    if (sort === 'price_asc')  q += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') q += ' ORDER BY p.price DESC';
    else if (sort === 'rating') q += ' ORDER BY avg_rating DESC';
    else q += ' ORDER BY p.id DESC';
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category, c.icon AS category_icon,
        ROUND(COALESCE(AVG(r.stars),0),1) AS avg_rating, COUNT(r.id) AS rating_count
       FROM products p
       LEFT JOIN categories c ON p.category_id=c.id
       LEFT JOIN ratings r ON p.id=r.product_id
       WHERE p.id=? GROUP BY p.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const [bd] = await db.query(
      'SELECT stars, COUNT(*) AS count FROM ratings WHERE product_id=? GROUP BY stars ORDER BY stars DESC',
      [req.params.id]
    );
    res.json({ ...rows[0], breakdown: bd });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, description, price, stock, image_emoji, category_id } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const [r] = await db.query(
      'INSERT INTO products(name,description,price,stock,image_emoji,category_id) VALUES(?,?,?,?,?,?)',
      [name, description || '', price, stock || 10, image_emoji || '📦', category_id || null]
    );
    res.status(201).json({ id: r.insertId, message: 'Product added!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
//  RATINGS
// ════════════════════════════════════════════════════════════
app.post('/api/ratings', auth, async (req, res) => {
  try {
    const { product_id, stars } = req.body;
    if (!product_id || !stars || stars < 1 || stars > 5)
      return res.status(400).json({ error: 'product_id and stars(1-5) required' });
    await db.query(
      'INSERT INTO ratings(user_id,product_id,stars) VALUES(?,?,?) ON DUPLICATE KEY UPDATE stars=VALUES(stars)',
      [req.user.id, product_id, stars]
    );
    const [[s]] = await db.query(
      'SELECT ROUND(AVG(stars),1) AS avg_rating, COUNT(*) AS rating_count FROM ratings WHERE product_id=?',
      [product_id]
    );
    res.json({ message: 'Rating saved!', ...s });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ratings/my/:product_id', auth, async (req, res) => {
  const [r] = await db.query(
    'SELECT stars FROM ratings WHERE user_id=? AND product_id=?',
    [req.user.id, req.params.product_id]
  );
  res.json(r.length ? r[0] : { stars: 0 });
});

// ════════════════════════════════════════════════════════════
//  CART
// ════════════════════════════════════════════════════════════
app.get('/api/cart', auth, async (req, res) => {
  const [r] = await db.query(
    `SELECT c.id, c.qty, p.id AS product_id, p.name, p.price, p.image_emoji, p.stock,
      cat.name AS category
     FROM cart c
     JOIN products p ON c.product_id=p.id
     LEFT JOIN categories cat ON p.category_id=cat.id
     WHERE c.user_id=?`,
    [req.user.id]
  );
  res.json(r);
});

app.post('/api/cart', auth, async (req, res) => {
  const { product_id, qty = 1 } = req.body;
  await db.query(
    'INSERT INTO cart(user_id,product_id,qty) VALUES(?,?,?) ON DUPLICATE KEY UPDATE qty=qty+VALUES(qty)',
    [req.user.id, product_id, qty]
  );
  res.json({ message: 'Added to cart' });
});

app.put('/api/cart/:pid', auth, async (req, res) => {
  const { qty } = req.body;
  if (qty < 1)
    await db.query('DELETE FROM cart WHERE user_id=? AND product_id=?', [req.user.id, req.params.pid]);
  else
    await db.query('UPDATE cart SET qty=? WHERE user_id=? AND product_id=?', [qty, req.user.id, req.params.pid]);
  res.json({ message: 'Updated' });
});

app.delete('/api/cart/:pid', auth, async (req, res) => {
  await db.query('DELETE FROM cart WHERE user_id=? AND product_id=?', [req.user.id, req.params.pid]);
  res.json({ message: 'Removed' });
});

// ════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════
app.post('/api/orders', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query(
      'SELECT c.product_id,c.qty,p.price,p.stock,p.name FROM cart c JOIN products p ON c.product_id=p.id WHERE c.user_id=?',
      [req.user.id]
    );
    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
    for (const i of items)
      if (i.stock < i.qty) throw new Error(`Not enough stock for "${i.name}"`);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const [ord] = await conn.query(
      'INSERT INTO orders(user_id,total_amount) VALUES(?,?)', [req.user.id, total]
    );
    for (const i of items) {
      await conn.query(
        'INSERT INTO order_items(order_id,product_id,qty,price) VALUES(?,?,?,?)',
        [ord.insertId, i.product_id, i.qty, i.price]
      );
      await conn.query('UPDATE products SET stock=stock-? WHERE id=?', [i.qty, i.product_id]);
    }
    await conn.query('DELETE FROM cart WHERE user_id=?', [req.user.id]);
    await conn.commit();
    res.status(201).json({ message: 'Order placed!', order_id: ord.insertId, total });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
        JSON_ARRAYAGG(JSON_OBJECT('name',p.name,'qty',oi.qty,'price',oi.price,'image',p.image_emoji)) AS items
       FROM orders o
       JOIN order_items oi ON o.id=oi.order_id
       JOIN products p ON oi.product_id=p.id
       WHERE o.user_id=?
       GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: '✅ EasyCart API running', time: new Date() })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 EasyCart API → http://localhost:${PORT}`));
