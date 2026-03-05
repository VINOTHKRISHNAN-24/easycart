import { useState, useEffect } from 'react';
import * as api from './api';

const formatINR = n => '₹' + Number(n).toLocaleString('en-IN');
const CATS = ['All', 'Mobiles', 'Home Appliances', 'Electronics', 'Fashion', 'Kitchen'];
const CI   = { All:'🛍️', Mobiles:'📱', 'Home Appliances':'🏠', Electronics:'⚡', Fashion:'👗', Kitchen:'🍽️' };
const EMJS = ['📦','📱','❄️','🫧','🧊','🌀','🎧','📺','💻','📷','👖','👟','⌚','🍲','🍳','🔥','🎮','🧴'];

function Stars({ value, onChange, readonly }) {
  const [hov, setHov] = useState(0);
  return (
    <span style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHov(s)}
          onMouseLeave={() => !readonly && setHov(0)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            fontSize: readonly ? 13 : 24,
            color: s <= (hov || Math.round(value)) ? '#f59e0b' : '#d1d5db',
            userSelect: 'none'
          }}>★</span>
      ))}
    </span>
  );
}

const S = {
  btn: (v = 'primary') => ({
    background: v==='primary' ? '#fbbf24' : v==='danger' ? '#ef4444' : v==='outline' ? 'transparent' : '#f1f5f9',
    color: v==='primary' ? '#0f172a' : v==='danger' ? '#fff' : v==='outline' ? '#fbbf24' : '#475569',
    border: v==='outline' ? '2px solid #fbbf24' : 'none',
    borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontWeight: 700,
    fontSize: 14, fontFamily: "'DM Sans',sans-serif", transition: 'all .15s'
  }),
  inp: {
    width: '100%', padding: '11px 14px', borderRadius: 9,
    border: '1.5px solid #e2e8f0', fontSize: 14,
    fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#f8fafc'
  },
  lbl: {
    fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5,
    display: 'block', textTransform: 'uppercase', letterSpacing: '.05em'
  },
  card: {
    background: '#fff', borderRadius: 14, boxShadow: '0 1px 14px rgba(0,0,0,0.05)',
    overflow: 'hidden', transition: 'transform .2s,box-shadow .2s'
  },
};

export default function App() {
  const [page, setPage]     = useState('home');
  const [products, setProds]= useState([]);
  const [cats, setCats]     = useState([]);
  const [cart, setCart]     = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser]     = useState(null);
  const [sel, setSel]       = useState(null);
  const [myR, setMyR]       = useState(0);
  const [cat, setCat]       = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState('');
  const [toast, setToast]   = useState('');
  const [su, setSu]         = useState({ name:'', email:'', password:'', phone:'' });
  const [li, setLi]         = useState({ email:'', password:'' });
  const [err, setErr]       = useState('');
  const [np, setNp]         = useState({ name:'', price:'', category_id:1, description:'', image_emoji:'📦', stock:'' });

  const showToast = m => { setToast(m); setTimeout(() => setToast(''), 2800); };

  useEffect(() => {
    const token = localStorage.getItem('ec_token');
    const saved = localStorage.getItem('ec_user');
    if (token && saved) { setUser(JSON.parse(saved)); loadCart(); }
    loadProds(); loadCats();
  }, []);

  useEffect(() => {
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (search) params.search = search;
    if (sort) params.sort = sort;
    loadProds(params);
  }, [cat, search, sort]);

  const loadProds = async (p = {}) => { try { setProds(await api.getProducts(p)); } catch {} };
  const loadCats  = async () => { try { setCats(await api.getCategories()); } catch {} };
  const loadCart  = async () => { try { setCart(await api.getCart()); } catch {} };

  const doAddToCart = async product => {
    if (!user) { showToast('Please login to add to cart! 🔑'); return; }
    try { await api.addToCart({ product_id: product.id, qty: 1 }); await loadCart(); showToast(`"${product.name}" added! 🛒`); }
    catch (e) { showToast(e.message); }
  };

  const doUpdateQty = async (pid, qty) => {
    try { await api.updateCartItem(pid, qty); await loadCart(); }
    catch (e) { showToast(e.message); }
  };

  const doRemove = async pid => {
    try { await api.removeCartItem(pid); await loadCart(); showToast('Removed from cart'); }
    catch (e) { showToast(e.message); }
  };

  const doSignup = async () => {
    if (!su.name || !su.email || !su.password) { setErr('All fields required.'); return; }
    try {
      const d = await api.signup(su);
      localStorage.setItem('ec_token', d.token);
      localStorage.setItem('ec_user', JSON.stringify(d.user));
      setUser(d.user); setSu({ name:'', email:'', password:'', phone:'' }); setErr('');
      await loadCart(); setPage('shop'); showToast(`Welcome, ${d.user.name}! 🎉`);
    } catch (e) { setErr(e.message); }
  };

  const doLogin = async () => {
    if (!li.email || !li.password) { setErr('All fields required.'); return; }
    try {
      const d = await api.login(li);
      localStorage.setItem('ec_token', d.token);
      localStorage.setItem('ec_user', JSON.stringify(d.user));
      setUser(d.user); setLi({ email:'', password:'' }); setErr('');
      await loadCart(); setPage('shop'); showToast(`Welcome back, ${d.user.name}! 👋`);
    } catch (e) { setErr(e.message); }
  };

  const doLogout = () => {
    localStorage.removeItem('ec_token'); localStorage.removeItem('ec_user');
    setUser(null); setCart([]); setPage('home'); showToast('Logged out!');
  };

  const doAddProduct = async () => {
    if (!np.name || !np.price) { showToast('Name and price required!'); return; }
    try { await api.addProduct(np); await loadProds(); setPage('shop'); showToast('Product added! ✅'); }
    catch (e) { showToast(e.message); }
  };

  const doRating = async pid => {
    if (!myR) { showToast('Select a star rating!'); return; }
    try {
      await api.submitRating({ product_id: pid, stars: myR });
      setSel(await api.getProduct(pid)); setMyR(0); showToast('Rating submitted! ⭐');
    } catch (e) { showToast(e.message); }
  };

  const doPlaceOrder = async () => {
    try {
      const d = await api.placeOrder();
      setCart([]); setOrders(await api.getOrders());
      setPage('orders'); showToast(`Order #${d.order_id} placed! 🎉`);
    } catch (e) { showToast(e.message); }
  };

  const openProduct = async p => {
    try {
      setSel(await api.getProduct(p.id)); setMyR(0); setPage('product');
      if (user) { const r = await api.getMyRating(p.id); setMyR(r.stars || 0); }
    } catch {}
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const PCard = ({ p }) => (
    <div style={{ ...S.card, cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 14px rgba(0,0,0,0.05)'; }}>
      <div style={{ background:'linear-gradient(135deg,#f8fafc,#e2e8f0)', textAlign:'center', fontSize:62, padding:'24px 0 16px' }} onClick={() => openProduct(p)}>{p.image_emoji}</div>
      <div style={{ padding:'13px 15px 17px', display:'flex', flexDirection:'column' }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#92400e', background:'#fef9c3', padding:'2px 8px', borderRadius:20, display:'inline-block', marginBottom:6 }}>{CI[p.category]} {p.category}</span>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.3 }} onClick={() => openProduct(p)}>{p.name}</div>
        <div style={{ color:'#94a3b8', fontSize:11, marginBottom:8, flex:1 }}>{p.description?.slice(0, 58)}...</div>
        <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:9 }}>
          <Stars value={p.avg_rating} readonly />
          <span style={{ fontSize:11, color:'#94a3b8' }}>{Number(p.avg_rating).toFixed(1)} ({p.rating_count})</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:16 }}>{formatINR(p.price)}</span>
          <button style={{ ...S.btn('primary'), padding:'7px 13px', fontSize:12 }} onClick={() => doAddToCart(p)}>Add to Cart</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f1f5f9', minHeight:'100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>

      {/* Toast */}
      {toast && <div style={{ position:'fixed', bottom:26, left:'50%', transform:'translateX(-50%)', background:'#0f172a', color:'#fbbf24', padding:'12px 26px', borderRadius:12, fontWeight:600, fontSize:14, zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      {/* Nav */}
      <nav style={{ background:'#0f172a', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:500, boxShadow:'0 2px 20px rgba(0,0,0,0.3)' }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'#fbbf24', cursor:'pointer' }} onClick={() => setPage('home')}>🛒 EasyCart</span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {[['Home','home'],['Shop','shop']].map(([l, p]) => (
            <button key={p} onClick={() => setPage(p)} style={{ background: page===p ? '#fbbf24' : 'transparent', color: page===p ? '#0f172a' : '#e2e8f0', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, fontSize:13 }}>{l}</button>
          ))}
          {user && <>
            <button onClick={() => setPage('add')} style={{ background: page==='add' ? '#fbbf24' : 'transparent', color: page==='add' ? '#0f172a' : '#e2e8f0', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, fontSize:13 }}>+ Add</button>
            <button onClick={async () => { setPage('orders'); setOrders(await api.getOrders()); }} style={{ background: page==='orders' ? '#fbbf24' : 'transparent', color: page==='orders' ? '#0f172a' : '#e2e8f0', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, fontSize:13 }}>Orders</button>
            <button onClick={() => setPage('profile')} style={{ background: page==='profile' ? '#fbbf24' : 'transparent', color: page==='profile' ? '#0f172a' : '#e2e8f0', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, fontSize:13 }}>👤 {user.name.split(' ')[0]}</button>
            <button onClick={doLogout} style={{ background:'transparent', color:'#f87171', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, fontSize:13 }}>Logout</button>
          </>}
          {!user && <>
            <button onClick={() => { setErr(''); setPage('login'); }} style={{ background: page==='login' ? '#fbbf24' : 'transparent', color: page==='login' ? '#0f172a' : '#e2e8f0', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600, fontSize:13 }}>Login</button>
            <button onClick={() => { setErr(''); setPage('signup'); }} style={{ ...S.btn('primary'), padding:'6px 13px', fontSize:13 }}>Sign Up</button>
          </>}
          <button onClick={() => setPage('cart')} style={{ background:'#fbbf24', color:'#0f172a', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            🛒 {cartCount > 0 && <span style={{ background:'#ef4444', color:'#fff', borderRadius:'50%', padding:'1px 6px', fontSize:11, marginLeft:4 }}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* HOME */}
      {page === 'home' && (
        <div>
          <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)', padding:'68px 24px 56px', textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', letterSpacing:'.2em', textTransform:'uppercase', marginBottom:10 }}>🇮🇳 India's Favourite Store</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:52, color:'#fbbf24', margin:'0 0 12px' }}>EasyCart</h1>
            <p style={{ color:'#94a3b8', fontSize:17, marginBottom:32 }}>Shop Mobiles, Home Appliances, Electronics & more.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button style={{ ...S.btn('primary'), padding:'13px 32px', fontSize:16 }} onClick={() => setPage('shop')}>Shop Now →</button>
              {!user && <button style={{ ...S.btn('outline'), padding:'13px 32px', fontSize:16 }} onClick={() => setPage('signup')}>Create Free Account</button>}
            </div>
          </div>
          <div style={{ background:'#fff', overflowX:'auto' }}>
            <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 24px', display:'flex' }}>
              {CATS.filter(c => c !== 'All').map(c => (
                <button key={c} onClick={() => { setCat(c); setPage('shop'); }}
                  style={{ background:'none', border:'none', borderBottom:'3px solid transparent', padding:'15px 17px', cursor:'pointer', fontWeight:600, fontSize:13, color:'#475569', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.color='#fbbf24'; e.currentTarget.style.borderBottomColor='#fbbf24'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='#475569'; e.currentTarget.style.borderBottomColor='transparent'; }}>
                  {CI[c]} {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxWidth:1180, margin:'0 auto', padding:'28px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28 }}>🔥 Top Deals</h2>
              <button style={{ ...S.btn('outline'), padding:'7px 14px', fontSize:13 }} onClick={() => setPage('shop')}>View All →</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
              {products.slice(0, 8).map(p => <PCard key={p.id} p={p} />)}
            </div>
          </div>
          <footer style={{ background:'#0f172a', color:'#475569', textAlign:'center', padding:'22px', fontSize:13, marginTop:40 }}>
            © 2025 EasyCart India · Made with ❤️ in India
          </footer>
        </div>
      )}

      {/* SHOP */}
      {page === 'shop' && (
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'28px 24px' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, marginBottom:20 }}>All Products</h2>
          <div style={{ background:'#fff', borderRadius:12, padding:'13px 17px', marginBottom:17, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <input style={{ ...S.inp, width:210 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.inp, width:170 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
            {user && <button style={{ ...S.btn('primary'), padding:'7px 13px', fontSize:12, marginLeft:'auto' }} onClick={() => setPage('add')}>+ Add Product</button>}
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:17 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ background: cat===c ? '#fbbf24' : '#fff', color: cat===c ? '#0f172a' : '#475569', border:'1.5px solid '+(cat===c ? '#fbbf24' : '#e2e8f0'), borderRadius:20, padding:'6px 13px', cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{CI[c]} {c}</button>
            ))}
          </div>
          {!products.length
            ? <div style={{ textAlign:'center', padding:64, color:'#94a3b8', fontSize:17 }}>No products found 😔</div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>{products.map(p => <PCard key={p.id} p={p} />)}</div>}
        </div>
      )}

      {/* PRODUCT DETAIL */}
      {page === 'product' && sel && (
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 24px' }}>
          <button style={{ ...S.btn(), marginBottom:18 }} onClick={() => setPage('shop')}>← Back</button>
          <div style={{ background:'#fff', borderRadius:18, boxShadow:'0 2px 22px rgba(0,0,0,0.07)', overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1.2fr' }}>
            <div style={{ background:'linear-gradient(135deg,#f8fafc,#e2e8f0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:110, padding:52 }}>{sel.image_emoji}</div>
            <div style={{ padding:38 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#92400e', background:'#fef9c3', padding:'3px 10px', borderRadius:20 }}>{sel.category}</span>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:27, margin:'12px 0 8px' }}>{sel.name}</h2>
              <p style={{ color:'#64748b', lineHeight:1.7, marginBottom:14 }}>{sel.description}</p>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <Stars value={sel.avg_rating} readonly /><b>{Number(sel.avg_rating).toFixed(1)}</b>
                <span style={{ color:'#94a3b8', fontSize:13 }}>({sel.rating_count} ratings)</span>
              </div>
              <div style={{ fontSize:34, fontWeight:900, marginBottom:6 }}>{formatINR(sel.price)}</div>
              <div style={{ fontSize:12, fontWeight:700, color: sel.stock > 0 ? '#22c55e' : '#ef4444', marginBottom:20 }}>{sel.stock > 0 ? `✓ In Stock (${sel.stock} left)` : '✗ Out of Stock'}</div>
              <button style={{ ...S.btn('primary'), width:'100%', padding:14, fontSize:15 }} onClick={() => doAddToCart(sel)}>Add to Cart 🛒</button>
            </div>
          </div>
          <div style={{ background:'#fff', borderRadius:18, padding:30, marginTop:18 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, marginBottom:17 }}>Rate & Review</h3>
            {!user
              ? <div style={{ background:'#fef9c3', borderRadius:10, padding:'14px 18px', color:'#92400e', display:'flex', alignItems:'center', gap:12 }}>
                  <span>Login to rate this product</span>
                  <button style={{ ...S.btn('primary'), padding:'7px 14px', fontSize:13 }} onClick={() => setPage('login')}>Login</button>
                </div>
              : <div>
                  <label style={S.lbl}>Your Rating {myR > 0 ? '(tap to update)' : ''}</label>
                  <Stars value={myR} onChange={setMyR} />
                  <button style={{ ...S.btn('primary'), marginTop:13 }} onClick={() => doRating(sel.id)}>Submit Rating ⭐</button>
                </div>
            }
            {sel.breakdown?.length > 0 && (
              <div style={{ display:'flex', gap:26, marginTop:22, flexWrap:'wrap' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:46, fontWeight:900 }}>{Number(sel.avg_rating).toFixed(1)}</div>
                  <Stars value={sel.avg_rating} readonly />
                  <div style={{ color:'#94a3b8', fontSize:12, marginTop:4 }}>{sel.rating_count} ratings</div>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  {[5,4,3,2,1].map(s => {
                    const row = sel.breakdown.find(b => b.stars === s) || { count:0 };
                    const pct = sel.rating_count ? row.count / sel.rating_count * 100 : 0;
                    return (
                      <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                        <span style={{ fontSize:12, width:33 }}>{s} ★</span>
                        <div style={{ flex:1, background:'#f1f5f9', borderRadius:20, height:8 }}>
                          <div style={{ width:`${pct}%`, background:'#fbbf24', height:'100%', borderRadius:20 }} />
                        </div>
                        <span style={{ fontSize:12, color:'#94a3b8', width:17 }}>{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART */}
      {page === 'cart' && (
        <div style={{ maxWidth:840, margin:'0 auto', padding:'28px 24px' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, marginBottom:22 }}>My Cart</h2>
          {!user
            ? <div style={{ background:'#fff', borderRadius:18, padding:60, textAlign:'center' }}><div style={{ fontSize:64 }}>🔑</div><p style={{ color:'#94a3b8', fontSize:17, margin:'12px 0 22px' }}>Please login to view cart</p><button style={{ ...S.btn('primary'), padding:'12px 28px', fontSize:15 }} onClick={() => setPage('login')}>Login</button></div>
            : cart.length === 0
              ? <div style={{ background:'#fff', borderRadius:18, padding:60, textAlign:'center' }}><div style={{ fontSize:64 }}>🛒</div><p style={{ color:'#94a3b8', fontSize:17, margin:'12px 0 22px' }}>Your cart is empty!</p><button style={{ ...S.btn('primary'), padding:'12px 28px', fontSize:15 }} onClick={() => setPage('shop')}>Start Shopping →</button></div>
              : <>
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', marginBottom:13 }}>
                    {cart.map((item, i) => (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 20px', borderBottom: i < cart.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                        <span style={{ fontSize:38 }}>{item.image_emoji}</span>
                        <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14 }}>{item.name}</div><div style={{ color:'#fbbf24', fontWeight:700, fontSize:13 }}>{formatINR(item.price)}</div></div>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <button style={{ background:'#f1f5f9', border:'none', borderRadius:7, padding:'3px 11px', fontSize:17, cursor:'pointer' }} onClick={() => doUpdateQty(item.product_id, item.qty - 1)}>−</button>
                          <span style={{ fontWeight:700, minWidth:20, textAlign:'center' }}>{item.qty}</span>
                          <button style={{ background:'#f1f5f9', border:'none', borderRadius:7, padding:'3px 11px', fontSize:17, cursor:'pointer' }} onClick={() => doUpdateQty(item.product_id, item.qty + 1)}>+</button>
                        </div>
                        <span style={{ fontWeight:800, fontSize:14, minWidth:80, textAlign:'right' }}>{formatINR(item.price * item.qty)}</span>
                        <button style={{ ...S.btn('danger'), padding:'5px 11px', fontSize:12 }} onClick={() => doRemove(item.product_id)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#fff', borderRadius:16, padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:'#64748b', fontSize:13 }}>{cartCount} item{cartCount > 1 ? 's' : ''} · Free Delivery</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700 }}>{formatINR(cartTotal)}</div>
                    </div>
                    <button style={{ ...S.btn('primary'), padding:'13px 28px', fontSize:15 }} onClick={doPlaceOrder}>Place Order →</button>
                  </div>
                </>
          }
        </div>
      )}

      {/* SIGNUP */}
      {page === 'signup' && (
        <div style={{ maxWidth:460, margin:'52px auto', padding:'0 20px' }}>
          <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 4px 28px rgba(0,0,0,0.1)', padding:'42px 36px' }}>
            <div style={{ textAlign:'center', marginBottom:26 }}><div style={{ fontSize:46 }}>👤</div><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:27, margin:'8px 0 4px' }}>Create Account</h2></div>
            {err && <div style={{ background:'#fef2f2', color:'#ef4444', padding:'10px 14px', borderRadius:8, marginBottom:14, fontSize:13, fontWeight:600 }}>⚠️ {err}</div>}
            {[['Full Name','name','text','Rahul Sharma'],['Email','email','email','rahul@example.com'],['Mobile','phone','tel','+91 98765 43210'],['Password','password','password','••••••••']].map(([l, k, t, ph]) => (
              <div key={k} style={{ marginBottom:13 }}><label style={S.lbl}>{l}</label><input style={S.inp} placeholder={ph} type={t} value={su[k]} onChange={e => setSu(p => ({ ...p, [k]: e.target.value }))} /></div>
            ))}
            <button style={{ ...S.btn('primary'), width:'100%', padding:14, fontSize:15, marginTop:6 }} onClick={doSignup}>Create Account 🎉</button>
            <p style={{ textAlign:'center', marginTop:14, color:'#64748b', fontSize:13 }}>Already registered? <span style={{ color:'#fbbf24', fontWeight:700, cursor:'pointer' }} onClick={() => { setErr(''); setPage('login'); }}>Login here</span></p>
          </div>
        </div>
      )}

      {/* LOGIN */}
      {page === 'login' && (
        <div style={{ maxWidth:460, margin:'52px auto', padding:'0 20px' }}>
          <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 4px 28px rgba(0,0,0,0.1)', padding:'42px 36px' }}>
            <div style={{ textAlign:'center', marginBottom:26 }}><div style={{ fontSize:46 }}>🔑</div><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:27, margin:'8px 0 4px' }}>Welcome Back</h2></div>
            {err && <div style={{ background:'#fef2f2', color:'#ef4444', padding:'10px 14px', borderRadius:8, marginBottom:14, fontSize:13, fontWeight:600 }}>⚠️ {err}</div>}
            <div style={{ marginBottom:13 }}><label style={S.lbl}>Email</label><input style={S.inp} placeholder="rahul@example.com" type="email" value={li.email} onChange={e => setLi(p => ({ ...p, email: e.target.value }))} /></div>
            <div style={{ marginBottom:22 }}><label style={S.lbl}>Password</label><input style={S.inp} placeholder="••••••••" type="password" value={li.password} onChange={e => setLi(p => ({ ...p, password: e.target.value }))} /></div>
            <button style={{ ...S.btn('primary'), width:'100%', padding:14, fontSize:15 }} onClick={doLogin}>Login →</button>
            <p style={{ textAlign:'center', marginTop:14, color:'#64748b', fontSize:13 }}>New here? <span style={{ color:'#fbbf24', fontWeight:700, cursor:'pointer' }} onClick={() => { setErr(''); setPage('signup'); }}>Create free account</span></p>
          </div>
        </div>
      )}

      {/* ADD PRODUCT */}
      {page === 'add' && user && (
        <div style={{ maxWidth:560, margin:'38px auto', padding:'0 20px' }}>
          <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 4px 28px rgba(0,0,0,0.1)', padding:'38px' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:27, marginBottom:22 }}>Add New Product</h2>
            <div style={{ marginBottom:13 }}><label style={S.lbl}>Product Name *</label><input style={S.inp} placeholder="e.g. Samsung Galaxy A55" value={np.name} onChange={e => setNp(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:13 }}>
              <div><label style={S.lbl}>Price (₹) *</label><input style={S.inp} placeholder="24999" type="number" value={np.price} onChange={e => setNp(p => ({ ...p, price: e.target.value }))} /></div>
              <div><label style={S.lbl}>Stock Qty</label><input style={S.inp} placeholder="10" type="number" value={np.stock} onChange={e => setNp(p => ({ ...p, stock: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom:13 }}><label style={S.lbl}>Category</label>
              <select style={S.inp} value={np.category_id} onChange={e => setNp(p => ({ ...p, category_id: e.target.value }))}>
                {cats.map(c => <option key={c.id} value={c.id}>{CI[c.name] || '📦'} {c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:13 }}><label style={S.lbl}>Description</label><textarea style={{ ...S.inp, height:76, resize:'vertical' }} placeholder="Product features..." value={np.description} onChange={e => setNp(p => ({ ...p, description: e.target.value }))} /></div>
            <div style={{ marginBottom:22 }}><label style={S.lbl}>Icon</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:5 }}>
                {EMJS.map(e => <span key={e} onClick={() => setNp(p => ({ ...p, image_emoji: e }))} style={{ fontSize:22, cursor:'pointer', padding:7, borderRadius:9, background: np.image_emoji===e ? '#fef9c3' : '#f8fafc', border:'2px solid '+(np.image_emoji===e ? '#fbbf24' : 'transparent') }}>{e}</span>)}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...S.btn('primary'), flex:1, padding:13, fontSize:14 }} onClick={doAddProduct}>Add Product ✅</button>
              <button style={{ ...S.btn(), padding:'13px 16px' }} onClick={() => setPage('shop')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {page === 'orders' && (
        <div style={{ maxWidth:840, margin:'0 auto', padding:'28px 24px' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, marginBottom:22 }}>My Orders</h2>
          {orders.length === 0
            ? <div style={{ background:'#fff', borderRadius:18, padding:60, textAlign:'center' }}><div style={{ fontSize:64 }}>📦</div><p style={{ color:'#94a3b8', fontSize:17, margin:'12px 0 22px' }}>No orders yet!</p><button style={{ ...S.btn('primary'), padding:'12px 28px', fontSize:15 }} onClick={() => setPage('shop')}>Start Shopping →</button></div>
            : orders.map(o => (
                <div key={o.id} style={{ background:'#fff', borderRadius:16, padding:'18px 22px', marginBottom:13 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
                    <div><span style={{ fontWeight:700, fontSize:15 }}>Order #{String(o.id).slice(-6)}</span><span style={{ color:'#94a3b8', fontSize:12, marginLeft:8 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</span></div>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}><span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>✓ {o.status}</span><span style={{ fontWeight:800, fontSize:15 }}>{formatINR(o.total_amount)}</span></div>
                  </div>
                  {o.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', gap:9, alignItems:'center', padding:'6px 0', borderTop:'1px solid #f1f5f9', fontSize:13 }}>
                      <span style={{ fontSize:26 }}>{item.image}</span>
                      <span style={{ flex:1 }}>{item.name}</span>
                      <span style={{ color:'#94a3b8' }}>x{item.qty}</span>
                      <span style={{ fontWeight:700 }}>{formatINR(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              ))
          }
        </div>
      )}

      {/* PROFILE */}
      {page === 'profile' && user && (
        <div style={{ maxWidth:520, margin:'38px auto', padding:'0 20px' }}>
          <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 4px 28px rgba(0,0,0,0.1)', padding:'42px 36px', textAlign:'center' }}>
            <div style={{ width:78, height:78, borderRadius:'50%', background:'#0f172a', color:'#fbbf24', fontSize:32, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontFamily:"'Playfair Display',serif", fontWeight:700 }}>{user.name[0].toUpperCase()}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:25, margin:'0 0 4px' }}>{user.name}</h2>
            <p style={{ color:'#94a3b8', marginBottom:26 }}>{user.email}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:11, marginBottom:26 }}>
              {[['🛒', cartCount, 'In Cart'], ['📦', orders.length, 'Orders'], ['⭐', '—', 'Ratings']].map(([ic, v, l]) => (
                <div key={l} style={{ background:'#f8fafc', borderRadius:12, padding:13 }}>
                  <div style={{ fontSize:24 }}>{ic}</div>
                  <div style={{ fontWeight:900, fontSize:21 }}>{v}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button style={S.btn('primary')} onClick={() => setPage('shop')}>Go Shopping</button>
              <button style={{ ...S.btn(), color:'#ef4444', border:'1.5px solid #ef4444' }} onClick={doLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
