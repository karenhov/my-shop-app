import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, Trash2, Plus, ChevronLeft, Package, Tag, 
  ClipboardList, Settings, LogOut, Search, Menu, X, 
  User, Edit2, CheckCircle2, Image as ImageIcon, Loader2
} from 'lucide-react';
import { Product, CartItem, PromoCode, Order } from './types';
import { generateSneakerLogo } from './services/logoService';

export default function App() {
  const [view, setView] = useState<'home' | 'categories' | 'products' | 'cart' | 'admin'>('home');
  const [category, setCategory] = useState<'sneakers' | 'slippers' | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [adminAuth, setAdminAuth] = useState<string | null>(localStorage.getItem('adminPass'));
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminView, setAdminView] = useState<'products' | 'promo' | 'orders' | 'settings'>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean, type: string, isPostgres: boolean, error?: string } | null>(null);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const optimizeImageUrl = (url: string, width = 400, quality = 80) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
    }
    return url;
  };

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(data => Array.isArray(data) && setProducts(data));
    fetch('/api/promo-codes').then(res => res.json()).then(data => Array.isArray(data) && setPromoCodes(data));
    fetch('/api/db-status').then(res => res.json()).then(setDbStatus);
  }, []);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: product.min_quantity || 1 }];
    });
    showNotification('Ավելացվեց զամբյուղ');
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const min = item.min_quantity || 1;
        return { ...item, quantity: Math.max(min, item.quantity + delta) };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return appliedPromo ? subtotal * (1 - appliedPromo.discount_percent / 100) : subtotal;
  };

  const handleCheckout = async (customerData: any) => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...customerData, total_price: calculateTotal(), items: cart })
    });
    if (response.ok) {
      setCart([]); setAppliedPromo(null); setView('home'); setShowOrderSuccess(true);
      setTimeout(() => setShowOrderSuccess(false), 5000);
    }
    setIsCheckingOut(false);
  };

  const handleAdminLogin = async (password: string) => {
    setIsLoggingIn(true);
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (response.ok) {
      setAdminAuth(password);
      localStorage.setItem('adminPass', password);
    } else alert('Սխալ գաղտնաբառ');
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2">
            <CheckCircle2 size={20} /> {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setView('home')} className="text-lg sm:text-xl font-bold tracking-tighter">
            <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">Մեծածախ Վաճառք</span>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('categories')} className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors">Ապրանքներ</button>
            <button onClick={() => setView('cart')} className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
            </button>
            <button onClick={() => setView('admin')} className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
              <User size={18} /> <span className="hidden sm:inline">Ադմին</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <div className="flex flex-col items-center justify-center min-h-[45vh] text-center mt-10 px-4">
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight">
                  <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">Մեծածախ Վաճառք</span>
                </h1>
                <p className="text-white/70 max-w-2xl mb-10 text-base sm:text-lg font-medium leading-relaxed">Բարձրորակ ապրանքներ ձեր բիզնեսի համար: Արագ առաքում և լավագույն գներ:</p>
                <button onClick={() => setView('categories')} className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-br from-blue-600 to-orange-600 rounded-2xl font-bold text-sm sm:text-lg hover:scale-105 transition-all active:scale-95 shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 border border-white/10">
                  <ShoppingCart size={20} /> Դիտել ապրանքները
                </button>
              </div>

              <div className="w-full max-w-6xl mt-20 px-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Ինչու՞ ընտրել մեզ</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <FeatureCard icon={<Package className="text-blue-400" size={18} />} title="Բարձր որակ" desc="Հավաստագրված" />
                  <FeatureCard icon={<ClipboardList className="text-orange-400" size={18} />} title="Արագ առաքում" desc="Ամբողջ ՀՀ" />
                  <FeatureCard icon={<CheckCircle2 className="text-orange-400" size={18} />} title="Երաշխիք" desc="Ապահով" />
                  <FeatureCard icon={<Tag className="text-blue-400" size={18} />} title="Մեծածախ" desc="Շահավետ" />
                </div>
              </div>

              <div className="w-full max-w-6xl mt-24 mb-20 px-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Կատեգորիաներ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CategoryActionCard title="Սպորտային կոշիկներ" desc="Լայն տեսականի մեծածախ գնորդների համար" color="bg-gradient-to-br from-blue-700 to-blue-900" onClick={() => { setCategory('sneakers'); setView('products'); }} />
                  <CategoryActionCard title="Հողաթափեր" desc="Ամենօրյա և աշխատանքային մոդելներ" color="bg-gradient-to-br from-orange-400 to-orange-600" onClick={() => { setCategory('slippers'); setView('products'); }} />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'products' && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex items-center w-full gap-4">
                  <button onClick={() => setView('categories')} className="p-2 hover:bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
                  <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight flex-1">{category === 'sneakers' ? 'Սպորտային կոշիկներ' : 'Հողաթափեր'}</h2>
                </div>
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input type="text" placeholder="Փնտրել ապրանք..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {products.filter(p => p.category === category).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product, index) => (
                  <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} priority={index < 4} />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8">ԶԱՄԲՅՈՒՂ</h2>
              {cart.length === 0 ? <p className="text-center py-20 text-white/40">Զամբյուղը դատարկ է</p> : (
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <img src={optimizeImageUrl(item.image, 100)} className="w-20 h-20 object-cover rounded-xl" />
                      <div className="flex-1">
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-blue-400 font-bold">{item.price.toLocaleString()} ֏</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="w-8 h-8 bg-white/10 rounded-full">-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="w-8 h-8 bg-white/10 rounded-full">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="flex justify-between text-xl font-bold"><span>Ընդհանուր</span><span className="text-orange-500">{calculateTotal().toLocaleString()} ֏</span></div>
                  </div>
                  <CheckoutForm onSubmit={handleCheckout} isLoading={isCheckingOut} />
                </div>
              )}
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!adminAuth ? (
                <div className="max-w-sm mx-auto py-20">
                  <input type="password" placeholder="Գաղտնաբառ" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-4 outline-none" />
                  <button onClick={() => handleAdminLogin(adminPassInput)} className="w-full py-4 bg-blue-600 rounded-2xl font-bold">ՄՈՒՏՔ</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex gap-4 border-b border-white/10 pb-4">
                    <button onClick={() => setAdminView('products')} className={`font-bold ${adminView === 'products' ? 'text-blue-500' : 'text-white/40'}`}>Ապրանքներ</button>
                    <button onClick={() => setAdminView('orders')} className={`font-bold ${adminView === 'orders' ? 'text-blue-500' : 'text-white/40'}`}>Պատվերներ</button>
                    <button onClick={() => setAdminAuth(null)} className="ml-auto text-red-500">Ելք</button>
                  </div>
                  {adminView === 'products' && <p className="text-white/40">Այստեղ կարող եք կառավարել ապրանքները:</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-3 sm:p-6 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors h-full">
      <div className="mb-2 sm:mb-4">{icon}</div>
      <h3 className="font-bold text-xs sm:text-lg mb-1">{title}</h3>
      <p className="text-[10px] sm:text-sm text-white/40">{desc}</p>
    </div>
  );
}

function CategoryActionCard({ title, desc, color, onClick }: { title: string, desc: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} p-5 sm:p-8 rounded-[2rem] text-left flex flex-col justify-between min-h-[180px] hover:scale-[1.02] transition-transform w-full`}>
      <div><h3 className="text-xl sm:text-2xl font-black mb-2">{title}</h3><p className="text-white/70 text-xs sm:text-sm">{desc}</p></div>
      <div className="mt-4"><span className="bg-white/20 px-4 py-1.5 rounded-full font-bold text-xs">Դիտել →</span></div>
    </button>
  );
}

function ProductCard({ product, onAdd, priority }: { product: Product, onAdd: () => void, priority?: boolean }) {
  const optimizeImageUrl = (url: string, width = 400) => url.includes('unsplash.com') ? `${url.split('?')[0]}?q=80&w=${width}&auto=format&fit=crop` : url;
  return (
    <motion.div initial={priority ? { opacity: 1 } : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col group">
      <div className="aspect-square relative overflow-hidden bg-zinc-900">
        <img src={optimizeImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold">{product.code}</div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-sm sm:text-lg mb-1 truncate">{product.name}</h3>
        <p className="text-sm sm:text-xl font-black mt-auto">{product.price.toLocaleString()} ֏</p>
        <button onClick={onAdd} className="w-full mt-3 py-2 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl text-xs font-bold">Ավելացնել</button>
      </div>
    </motion.div>
  );
}

function CheckoutForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); onSubmit(Object.fromEntries(formData)); }} className="space-y-4">
      <input name="customer_name" placeholder="Անուն Ազգանուն" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" />
      <input name="customer_phone" placeholder="Հեռախոս" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" />
      <textarea name="customer_address" placeholder="Հասցե" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none h-24" />
      <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 rounded-xl font-bold">{isLoading ? 'Մշակվում է...' : 'ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ'}</button>
    </form>
  );
}

function AdminNavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${active ? 'bg-blue-600 text-white' : 'text-white/40'}`}>
      {icon} {label}
    </button>
  );
}

function AddProductForm({ onAdd, initialData, isEdit }: { onAdd: (data: any) => void, initialData?: Product, isEdit?: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const data = Object.fromEntries(formData); onAdd({ ...data, price: Number(data.price), min_quantity: Number(data.min_quantity) }); }} className="grid grid-cols-1 gap-4">
      <input name="name" defaultValue={initialData?.name} placeholder="Անվանում" required className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" />
      <input name="price" defaultValue={initialData?.price} type="number" placeholder="Գին" required className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" />
      <button type="submit" className="py-4 bg-blue-600 rounded-xl font-bold">{isEdit ? 'ՊԱՀՊԱՆԵԼ' : 'ԱՎԵԼԱՑՆԵԼ'}</button>
    </form>
  );
}

function AddPromoForm({ onAdd }: { onAdd: (data: any) => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const data = Object.fromEntries(formData); onAdd({ ...data, discount_percent: Number(data.discount_percent) }); }} className="flex gap-4">
      <input name="code" placeholder="ՊՐՈՄՈԿՈԴ" required className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" />
      <button type="submit" className="px-8 bg-blue-600 rounded-xl font-bold">ԱՎԵԼԱՑՆԵԼ</button>
    </form>
  );
}
