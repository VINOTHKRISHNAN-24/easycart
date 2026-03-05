# 🛒 EasyCart

> A full-featured Indian e-commerce web application built with **React + Node.js + MySQL**

![EasyCart Banner](https://img.shields.io/badge/EasyCart-India's%20Favourite%20Store-fbbf24?style=for-the-badge&logo=shopify)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- 🛍️ **Product Catalog** — Mobiles, Home Appliances, Electronics, Fashion, Kitchen
- 🔍 **Search & Filter** — Search by name, filter by category, sort by price/rating
- ⭐ **Product Ratings** — Star ratings with breakdown per product
- 🛒 **Shopping Cart** — Add, remove, update quantities (saved per user)
- 📦 **Order Management** — Place orders, view order history
- 👤 **User Accounts** — Signup, Login, Profile page (JWT auth)
- ➕ **Add Products** — Logged-in users can add new products
- 💰 **Indian Rupees (₹)** — All prices in INR format
- 📱 **Responsive Design** — Works on mobile and desktop

---

## 📁 Project Structure

```
easycart/
├── 📄 README.md
├── 📄 .gitignore
├── 📄 easycart_database.sql        ← MySQL schema + seed data
│
├── 📂 frontend/                    ← React app (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 ← Main app component
│       ├── api.js                  ← All API calls
│       └── index.css
│
└── 📂 backend/                     ← Node.js + Express API
    ├── package.json
    ├── .env.example
    ├── server.js                   ← Entry point
    └── src/
        ├── db.js                   ← MySQL connection pool
        ├── routes/
        │   ├── auth.js             ← /api/auth/*
        │   ├── products.js         ← /api/products/*
        │   ├── categories.js       ← /api/categories
        │   ├── ratings.js          ← /api/ratings/*
        │   ├── cart.js             ← /api/cart/*
        │   └── orders.js           ← /api/orders/*
        └── middleware/
            └── auth.js             ← JWT verification
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/) 8.0+
- [Git](https://git-scm.com/)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/easycart.git
cd easycart
```

### 2. Setup the database

```bash
mysql -u root -p < easycart_database.sql
```

This will create the `easycart` database and seed it with 18 products across 5 categories.

### 3. Setup the backend

```bash
cd backend
npm install

# Copy env file and fill in your MySQL credentials
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=easycart
JWT_SECRET=your_secret_key_here
PORT=5000
```

Start the backend:
```bash
npm run dev
# API running at http://localhost:5000
```

### 4. Setup the frontend

```bash
cd ../frontend
npm install
npm run dev
# App running at http://localhost:5173
```

### 5. Open in browser

```
http://localhost:5173
```

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `users` | User accounts (bcrypt passwords) |
| `categories` | Product categories (Mobiles, Kitchen, etc.) |
| `products` | Product listings with stock |
| `ratings` | Star ratings (1 rating per user per product) |
| `cart` | Shopping cart items per user |
| `orders` | Order headers |
| `order_items` | Individual items within each order |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |
| GET | `/api/auth/me` | Get logged-in user profile |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List all products (supports ?category, ?search, ?sort) |
| GET | `/api/products/:id` | Get single product with rating breakdown |
| POST | `/api/products` | Add new product (auth required) |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:product_id` | Update item quantity |
| DELETE | `/api/cart/:product_id` | Remove item from cart |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Place order from cart |
| GET | `/api/orders` | Get user's order history |

### Ratings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ratings` | Submit/update a rating |
| GET | `/api/ratings/my/:product_id` | Get user's own rating for a product |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, vanilla CSS-in-JS |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 with mysql2/promise |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Dev Tools | nodemon, Vite HMR |

---

## 📸 Screenshots

| Home Page | Shop | Product Detail |
|---|---|---|
| Hero + featured products | Grid with filters | Ratings & reviews |

| Cart | Orders | Profile |
|---|---|---|
| Qty controls + checkout | Order history | User stats |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Made with ❤️ in India 🇮🇳

---

> **Note:** For production deployment, make sure to use HTTPS, a strong JWT secret, and never expose your `.env` file.
