const BASE = '/api';

function getToken() {
  return localStorage.getItem('ec_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const signup = (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) });
export const login  = (body) => request('/auth/login',  { method: 'POST', body: JSON.stringify(body) });
export const getMe  = ()     => request('/auth/me');

// Products
export const getProducts = (params = {}) => request('/products?' + new URLSearchParams(params).toString());
export const getProduct  = (id)           => request(`/products/${id}`);
export const addProduct  = (body)         => request('/products', { method: 'POST', body: JSON.stringify(body) });

// Categories
export const getCategories = () => request('/categories');

// Ratings
export const submitRating = (body) => request('/ratings', { method: 'POST', body: JSON.stringify(body) });
export const getMyRating  = (pid)  => request(`/ratings/my/${pid}`);

// Cart
export const getCart        = ()         => request('/cart');
export const addToCart      = (body)     => request('/cart', { method: 'POST', body: JSON.stringify(body) });
export const updateCartItem = (pid, qty) => request(`/cart/${pid}`, { method: 'PUT', body: JSON.stringify({ qty }) });
export const removeCartItem = (pid)      => request(`/cart/${pid}`, { method: 'DELETE' });

// Orders
export const placeOrder = () => request('/orders', { method: 'POST' });
export const getOrders  = () => request('/orders');
