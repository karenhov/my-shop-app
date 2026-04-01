import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  Package, 
  Tag, 
  ClipboardList, 
  Settings, 
  LogOut,
  Search,
  Menu,
  X,
  User,
  Edit2,
  CheckCircle2,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { Product, CartItem, PromoCode, Order } from './types';

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-3 sm:p-6 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors h-full">
      <div className="mb-2 sm:mb-4 flex justify-center w-full">{icon}</div>
      <h3 className="font-bold text-xs sm:text-lg mb-1">{title}</h3>
      <p className="text-[10px] sm:text-sm text-white/40 leading-tight sm:leading-relaxed">{desc}</p>
    </div>
  );
}

function CategoryActionCard({ title, desc, color, onClick }: { title: string, desc: string, color: string, onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`${color} p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] text-white relative overflow-hidden group h-full flex flex-col justify-end min-h-[200px] sm:min-h-[280px] shadow-2xl`}>
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Plus size={120} /></div>
      <div className="relative z-10 text-left"><h3 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none mb-2">{title}</h3><p className="text-white/70 text-xs sm:text-sm font-medium max-w-[200px]">{desc}</p></div>
    </motion.button>
  );
}

function CategoryCard({ title, image, onClick }: { title: string, image: string, onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="relative h-64 sm:h-96 rounded-[2rem] sm:rounded-[3rem] overflow-hidden group shadow-2xl">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-left"><h3 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none">{title}</h3><p className="text-blue-400 text-xs sm:text-sm font-bold mt-2 flex items-center gap-2">ԴԻՏԵԼ <Plus size={16} /></p></div>
    </motion.button>
  );
}

function ProductCard({ product, onAdd }: { product: Product, onAdd: () => void, key?: any }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizeImageUrl = (url: string, width = 400, quality = 80) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
    }
    return url;
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-b from-white/10 to-white/[0.02] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col hover:border-blue-500/30 transition-colors group">
      <div className="aspect-square overflow-hidden relative bg-zinc-900">
        {!isLoaded && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse"><ImageIcon className="text-white/10" size={24} /></div>}
        <img src={optimizeImageUrl(product.image, 400)} alt={product.name} onLoad={() => setIsLoaded(true)} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} referrerPolicy="no-referrer" />
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold tracking-widest uppercase border border-white/10">{product.code}</div>
      </div>
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-sm sm:text-lg mb-1 truncate group-hover:text-blue-400 transition-colors">{product.name}</h3>
        <p className="text-white/40 text-[10px] sm:text-xs mb-2 line-clamp-2">{product.description}</p>
        {product.min_quantity && product.min_quantity > 1 && <p className="text-[8px] sm:text-[10px] text-orange-400/80 font-bold mb-3 sm:mb-4 bg-orange-400/10 w-fit px-1.5 py-0.5 rounded-md">ՄԻՆ. ՔԱՆԱԿ: {product.min_quantity}</p>}
        <div className="mt-auto flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
          <p className="text-sm sm:text-xl font-black text-white">{product.price.toLocaleString()} ֏</p>
          <button onClick={onAdd} className="w-full xs:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-90 flex items-center justify-center gap-1.5">
            {(product.category === 'sneakers' || product.category === 'slippers') ? (
              <><ShoppingCart size={12} className="sm:size-[14px]" /><span className="text-[10px] sm:text-xs font-bold">Գնել</span></>
            ) : (
              <span className="text-[10px] sm:text-xs font-bold">Ավելացնել</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CheckoutForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (isLoading) return; const formData = new FormData(e.target as HTMLFormElement); onSubmit(Object.fromEntries(formData)); }} className="bg-white/5 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 space-y-4">
      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">ՊԱՏՎԻՐԵԼ</h3>
      <input name="customer_name" placeholder="Անուն Ազգանուն" required className="w-full bg-black border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 outline-none focus:border-blue-500 text-sm sm:text-base disabled:opacity-50" disabled={isLoading} />
      <input name="customer_phone" placeholder="Հեռախոսահամար" required className="w-full bg-black border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 outline-none focus:border-blue-500 text-sm sm:text-base disabled:opacity-50" disabled={isLoading} />
      <textarea name="customer_address" placeholder="Հասցե" required className="w-full bg-black border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 outline-none focus:border-blue-500 h-24 sm:h-32 text-sm sm:text-base disabled:opacity-50" disabled={isLoading} />
      <button type="submit" disabled={isLoading} className="w-full py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <><Loader2 className="animate-spin" size={20} /> ՄՇԱԿՎՈՒՄ Է...</> : 'ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ'}</button>
    </form>
  );
}

function AdminNavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${active ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white' : 'text-white/40 hover:bg-white/5'}`}>{icon} {label}</button>
  );
}

function AddProductForm({ onAdd, initialData, isEdit }: { onAdd: (data: any) => void, initialData?: Product, isEdit?: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const data = Object.fromEntries(formData); onAdd({ ...data, price: Number(data.price), min_quantity: Number(data.min_quantity) }); if (!isEdit) (e.target as HTMLFormElement).reset(); }} className="bg-white/5 p-6 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
      {!isEdit && <h3 className="col-span-full font-bold text-lg mb-2">ԱՎԵԼԱՑՆԵԼ ԱՊՐԱՆՔ</h3>}
      <input name="name" defaultValue={initialData?.name} placeholder="Անվանում" required className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      <input name="price" defaultValue={initialData?.price} type="number" placeholder="Գին" required className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      <input name="code" defaultValue={initialData?.code} placeholder="Կոդ" required className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      <input name="min_quantity" defaultValue={initialData?.min_quantity} type="number" placeholder="Մինիմալ քանակ (լռելյայն` 1)" className="bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      <select name="category" defaultValue={initialData?.category} className="col-span-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"><option value="sneakers">Սպորտային կոշիկներ</option><option value="slippers">Հողաթափեր</option></select>
      <input name="image" defaultValue={initialData?.image} placeholder="Նկարի URL" required className="col-span-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      <textarea name="description" defaultValue={initialData?.description} placeholder="Նկարագրություն" className="col-span-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 h-24" />
      <button type="submit" className={`col-span-full py-4 rounded-xl font-bold ${isEdit ? 'bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-orange-500'}`}>{isEdit ? 'ՊԱՀՊԱՆԵԼ' : 'ԱՎԵԼԱՑՆԵԼ'}</button>
    </form>
  );
}

function AddPromoForm({ onAdd }: { onAdd: (data: any) => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const data = Object.fromEntries(formData); onAdd({ ...data, discount_percent: Number(data.discount_percent) }); (e.target as HTMLFormElement).reset(); }} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]"><label className="block text-xs text-white/40 mb-1 ml-2">ՊՐՈՄՈԿՈԴ</label><input name="code" placeholder="Օրինակ` SALE20" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" /></div>
      <div className="w-32"><label className="block text-xs text-white/40 mb-1 ml-2">ԶԵՂՉ %</label><input name="discount_percent" type="number" placeholder="20" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" /></div>
      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold h-[50px]">ԱՎԵԼԱՑՆԵԼ</button>
    </form>
  );
}

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passChangeData, setPassChangeData] = useState({ oldPass: '', newPass: '', confirmPass: '' });

  const optimizeImageUrl = (url: string, width = 400, quality = 80) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
    }
    return url;
  };

  useEffect(() => {
    setShowInfoModal(true);
    const timer = setTimeout(() => setShowInfoModal(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setProducts(data))
      .catch(err => console.error("Failed to fetch products:", err));
    
    fetch('/api/promo-codes')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setPromoCodes(data))
      .catch(err => console.error("Failed to fetch promo codes:", err));

    fetch('/api/db-status')
      .then(res => res.json())
      .then(setDbStatus)
      .catch(err => console.error("Failed to fetch db status:", err));
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      const initialQty = product.min_quantity || 1;
      return [...prev, { ...product, quantity: initialQty }];
    });
    showNotification('Ավելացվեց զամբյուղ');
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const min = item.min_quantity || 1;
        const newQty = Math.max(min, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (appliedPromo) {
      return subtotal * (1 - appliedPromo.discount_percent / 100);
    }
    return subtotal;
  };

  const handleCheckout = async (customerData: any) => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const total = calculateTotal();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          total_price: total,
          items: cart
        })
      });
      if (response.ok) {
        setCart([]);
        setAppliedPromo(null);
        setView('home');
        setShowOrderSuccess(true);
        setTimeout(() => setShowOrderSuccess(false), 5000);
      } else {
        alert('Պատվերի գրանցումը ձախողվեց: Խնդրում ենք փորձել կրկին:');
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert('Սերվերի սխալ: Խնդրում ենք փորձել մի փոքր ուշ:');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAdminLogin = async (password: string) => {
    if (!password) return;
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        setAdminAuth(password);
        localStorage.setItem('adminPass', password);
        showNotification('Մուտքը հաջողվեց');
      } else {
        alert('Սխալ գաղտնաբառ');
      }
    } catch (error) {
      alert('Սերվերի սխալ: Խնդրում ենք փորձել մի փոքր ուշ:');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminAuth(null);
    localStorage.removeItem('adminPass');
  };

  const addProduct = async (productData: any) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productData, password: adminAuth })
    });
    if (response.ok) {
      const newProd = await response.json();
      setProducts(prev => [...prev, { ...productData, id: newProd.id }]);
      showNotification('Ապրանքը ավելացվեց');
    }
  };

  const updateProduct = async (id: number, productData: any) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productData, password: adminAuth })
    });
    if (response.ok) {
      setProducts(prev => prev.map(p => p.id === id ? { ...productData, id } : p));
      setEditingProduct(null);
      showNotification('Տվյալները փոփոխվեցին');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Ջնջե՞լ ապրանքը:')) return;
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminAuth })
    });
    if (response.ok) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showNotification('Ապրանքը ջնջվեց');
    }
  };

  const addPromo = async (promoData: any) => {
    const response = await fetch('/api/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...promoData, password: adminAuth })
    });
    if (response.ok) {
      const newPromo = await response.json();
      setPromoCodes(prev => [...prev, { ...promoData, id: newPromo.id }]);
      showNotification('Պրոմոկոդը ավելացվեց');
    }
  };

  const deletePromo = async (id: number) => {
    const response = await fetch(`/api/promo-codes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminAuth })
    });
    if (response.ok) {
      setPromoCodes(prev => prev.filter(p => p.id !== id));
      showNotification('Պրոմոկոդը ջնջվեց');
    }
  };

  const fetchOrders = async () => {
    const response = await fetch(`/api/orders?password=${adminAuth}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    }
  };

  useEffect(() => {
    if (adminAuth && adminView === 'orders') {
      fetchOrders();
    }
  }, [adminAuth, adminView]);

  const deleteOrder = async (id: number) => {
    if (!confirm('Ջնջե՞լ այս պատվերը:')) return;
    const response = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminAuth })
    });
    if (response.ok) {
      setOrders(prev => prev.filter(o => o.id !== id));
      showNotification('Պատվերը ջնջվեց');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passChangeData.newPass !== passChangeData.confirmPass) {
      alert('Նոր գաղտնաբառերը չեն համընկնում');
      return;
    }
    if (passChangeData.newPass.length < 6) {
      alert('Նոր գաղտնաբառը պետք է լինի առնվազն 6 նիշ');
      return;
    }

    setIsChangingPass(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passChangeData.oldPass,
          newPassword: passChangeData.newPass
        })
      });

      if (response.ok) {
        setAdminAuth(passChangeData.newPass);
        localStorage.setItem('adminPass', passChangeData.newPass);
        setPassChangeData({ oldPass: '', newPass: '', confirmPass: '' });
        showNotification('Գաղտնաբառը հաջողությամբ փոխվեց');
      } else {
        const data = await response.json();
        alert(data.error || 'Գաղտնաբառի փոփոխությունը ձախողվեց');
      }
    } catch (error) {
      alert('Սերվերի սխալ');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-[40%] right-[-5%] w-[30%] h-[30%] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-orange-500" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase">ՏԵՂԵԿԱՏՎՈՒԹՅՈՒՆ</h2>
              </div>
              <div className="space-y-4 text-white/80 leading-relaxed font-medium">
                <p>ԱՊՐԱՆՔԸ ԸՆՏՐԵԼԻՍ ՊԵՏՔ Է ՍԵՂՄԵԼ <span className="text-orange-400 font-bold">ԳՆԵԼ</span> ԿՈՃԱԿԸ:</p>
                <p>ԱՅՆ ԿՀԱՅՏՆՎԻ <span className="text-blue-400 font-bold">ԶԱՄԲՅՈՒՂ</span> ԲԱԺՆՈՒՄ, ՈՐՏԵՂ ԿԱՐՈՂ ԵՔ ԱՎԵԼԱՑՆԵԼ ԸՆՏՐՎԱԾ ԱՊՐԱՆՔՆԵՐԻ ՔԱՆԱԿՆԵՐԸ:</p>
                <p>ԿԱՏԱՐԵԼ ՊԱՏՎԵՐ ՍԵՂՄԵԼՈՎ <span className="text-green-400 font-bold">ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐ</span> ԿՈՃԱԿԸ:</p>
              </div>
              <button onClick={() => setShowInfoModal(false)} className="mt-8 w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-colors">ՀԱՍԿԱՆԱԼԻ Է</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrderSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-blue-600 to-orange-600 text-white px-8 py-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 text-center border border-white/20 backdrop-blur-xl max-w-xs w-full">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-tight">ՁԵՐ ՊԱՏՎԵՐՆ ՀԱՍՏԱՏՎԵԼ Է</h2>
            </div>
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
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
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
                  <ShoppingCart size={20} /> Դիտել Տեսականին
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

              {products.length > 0 && (
                <div className="w-full max-w-6xl mt-24 mb-20 px-2">
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Թոփ Ապրանքներ</h2>
                    <button onClick={() => setView('categories')} className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors">Տեսնել բոլորը →</button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {products.slice(0, 4).map(product => (
                      <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[60vh]">
              <CategoryCard title="ՍՊՈՐՏԱՅԻՆ ԿՈՇԻԿՆԵՐ" image="https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=1000&auto=format&fit=crop" onClick={() => { setCategory('sneakers'); setView('products'); }} />
              <CategoryCard title="ՀՈՂԱԹԱՓԵՐ" image="https://images.unsplash.com/photo-1603487742131-4160ec999306?q=80&w=1000&auto=format&fit=crop" onClick={() => { setCategory('slippers'); setView('products'); }} />
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
                {Array.isArray(products) && products
                  .filter(p => p.category === category)
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(product => (
                    <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
                  ))
                }
              </div>
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold">ԶԱՄԲՅՈՒՂ</h2>
                <button onClick={() => { if (confirm('Մաքրե՞լ զամբյուղը:')) setCart([]); }} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"><Trash2 size={14} /> ՄԱՔՐԵԼ</button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-12 sm:py-20 border border-dashed border-white/10 rounded-3xl">
                  <ShoppingCart size={40} className="mx-auto mb-4 text-white/20 sm:size-12" />
                  <p className="text-white/40 text-sm sm:text-base">Ձեր զամբյուղը դատարկ է:</p>
                  <button onClick={() => setView('categories')} className="mt-4 sm:mt-6 text-blue-500 font-bold hover:text-blue-400 transition-colors text-sm sm:text-base">Գնալ գնումների</button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 sm:gap-4 bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/5">
                      <img src={optimizeImageUrl(item.image, 200)} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="text-[10px] sm:text-sm text-white/40">Կոդ: {item.code}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-blue-400 font-bold text-sm sm:text-base">{item.price.toLocaleString()} ֏</p>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-orange-500/20 transition-colors text-sm">-</button>
                            <span className="text-sm sm:text-base">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-blue-500/20 transition-colors text-sm">+</button>
                            <button onClick={() => removeFromCart(item.id)} className="ml-1 sm:ml-2 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white/5 p-4 sm:p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex gap-2">
                      <input id="promo-input" type="text" placeholder="Պրոմոկոդ" className="flex-1 bg-black border border-white/10 rounded-xl px-3 sm:px-4 py-2 outline-none focus:border-blue-500 transition-colors text-sm sm:text-base" />
                      <button onClick={() => { const input = document.getElementById('promo-input') as HTMLInputElement; const found = promoCodes.find(p => p.code === input.value); if (found) { setAppliedPromo(found); input.value = ''; showNotification('Պրոմոկոդը կիրառվեց'); } else alert('Սխալ պրոմոկոդ'); }} className="px-3 sm:px-4 py-2 bg-blue-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-500 transition-all">ԿԻՐԱՌԵԼ</button>
                    </div>
                    {appliedPromo && <div className="flex justify-between text-xs sm:text-sm text-orange-400"><span>Զեղչ ({appliedPromo.discount_percent}%)</span><button onClick={() => setAppliedPromo(null)} className="underline hover:text-orange-300">Ջնջել</button></div>}
                    <div className="flex justify-between text-lg sm:text-xl font-bold pt-4 border-t border-white/10"><span>Ընդհանուր</span><span className="text-orange-500">{calculateTotal().toLocaleString()} ֏</span></div>
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
                  <h2 className="text-2xl font-bold mb-6 text-center">ԱԴՄԻՆ ՄՈՒՏՔ</h2>
                  <div className="space-y-4">
                    <input type="password" placeholder="Գաղտնաբառ" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(adminPassInput); }} />
                    <button onClick={() => handleAdminLogin(adminPassInput)} disabled={isLoggingIn} className="w-full py-4 bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50">{isLoggingIn ? 'ՄՈՒՏՔ...' : 'ՄՈՒՏՔ'}</button>
                    <p className="text-center text-white/40 text-xs">Լռելյայն գաղտնաբառը` admin123</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <AdminNavBtn active={adminView === 'products'} onClick={() => setAdminView('products')} icon={<Package size={18} />} label="Ապրանքներ" />
                      <AdminNavBtn active={adminView === 'promo'} onClick={() => setAdminView('promo')} icon={<Tag size={18} />} label="Պրոմոկոդեր" />
                      <AdminNavBtn active={adminView === 'orders'} onClick={() => setAdminView('orders')} icon={<ClipboardList size={18} />} label="Պատվերներ" />
                      <AdminNavBtn active={adminView === 'settings'} onClick={() => setAdminView('settings')} icon={<Settings size={18} />} label="Կարգավորումներ" />
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold px-4 py-2 hover:bg-red-500/10 rounded-xl transition-colors"><LogOut size={18} /> Ելք</button>
                  </div>
                  {adminView === 'products' && (
                    <div className="space-y-8">
                      {editingProduct ? (
                        <div className="bg-white/5 p-6 rounded-3xl border border-blue-500/30">
                          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">ԽՄԲԱԳՐԵԼ ԱՊՐԱՆՔԸ</h3><button onClick={() => setEditingProduct(null)} className="text-white/40"><X size={20} /></button></div>
                          <AddProductForm initialData={editingProduct} onAdd={(data) => updateProduct(editingProduct.id, data)} isEdit />
                        </div>
                      ) : <AddProductForm onAdd={addProduct} />}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(products) && products.map(p => (
                          <div key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <img src={optimizeImageUrl(p.image, 100)} className="w-16 h-16 object-cover rounded-lg" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0"><p className="font-bold truncate">{p.name}</p><p className="text-xs text-white/40">{p.category === 'sneakers' ? 'Կոշիկ' : 'Հողաթափ'}</p></div>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingProduct(p)} className="text-blue-500 p-2 hover:bg-blue-500/10 rounded-lg"><Edit2 size={18} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {adminView === 'promo' && (
                    <div className="space-y-8">
                      <AddPromoForm onAdd={addPromo} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.isArray(promoCodes) && promoCodes.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div><p className="font-bold text-blue-400">{p.code}</p><p className="text-sm text-white/40">{p.discount_percent}% զեղչ</p></div>
                            <button onClick={() => deletePromo(p.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {adminView === 'orders' && (
                    <div className="space-y-6">
                      {Array.isArray(orders) && orders.map(order => (
                        <div key={order.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                          <div className="flex flex-wrap justify-between gap-4 border-b border-white/10 pb-4">
                            <div><p className="text-sm text-white/40">Պատվեր #{order.id}</p><p className="font-bold text-lg">{order.customer_name}</p><p className="text-sm">{order.customer_phone}</p><p className="text-sm text-white/60">{order.customer_address}</p></div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <button onClick={() => deleteOrder(order.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                              <p className="text-xs text-white/20">{new Date(order.created_at).toLocaleString('hy-AM')}</p>
                              <p className="text-2xl font-black text-blue-500">{order.total_price.toLocaleString()} ֏</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {order.items.map(item => (
                              <div key={item.id} className="flex gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                                <img src={optimizeImageUrl(item.image, 100)} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                                <div><p className="text-sm font-bold truncate">{item.name}</p><p className="text-[10px] text-white/40">Կոդ: {item.code} | Քանակ: {item.quantity}</p><p className="text-xs text-orange-400">{item.price_at_time.toLocaleString()} ֏</p></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {adminView === 'settings' && (
                    <div className="max-w-md mx-auto space-y-10">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={20} className="text-blue-400" /> ՏՎՅԱԼՆԵՐԻ ԲԱԶԱ</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><span className="text-sm text-white/40">Տեսակ:</span><span className="text-sm font-medium">{dbStatus?.type || 'Բեռնվում է...'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-sm text-white/40">Կարգավիճակ:</span><span className={`text-sm font-bold flex items-center gap-1 ${dbStatus?.connected ? 'text-green-500' : 'text-red-500'}`}>{dbStatus?.connected ? <><CheckCircle2 size={14} /> Միացված է</> : <><X size={14} /> Անջատված է</>}</span></div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2"><User size={20} className="text-orange-400" /> ԳԱՂՏՆԱԲԱՌԻ ՓՈՓՈԽՈՒԹՅՈՒՆ</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          <div>
                            <label className="block text-xs text-white/40 mb-1 ml-2">ՀԻՆ ԳԱՂՏՆԱԲԱՌ</label>
                            <input 
                              type="password" 
                              required
                              value={passChangeData.oldPass}
                              onChange={(e) => setPassChangeData({ ...passChangeData, oldPass: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/40 mb-1 ml-2">ՆՈՐ ԳԱՂՏՆԱԲԱՌ</label>
                            <input 
                              type="password" 
                              required
                              value={passChangeData.newPass}
                              onChange={(e) => setPassChangeData({ ...passChangeData, newPass: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/40 mb-1 ml-2">ՀԱՍՏԱՏԵԼ ՆՈՐ ԳԱՂՏՆԱԲԱՌԸ</label>
                            <input 
                              type="password" 
                              required
                              value={passChangeData.confirmPass}
                              onChange={(e) => setPassChangeData({ ...passChangeData, confirmPass: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" 
                            />
                          </div>
                          <button 
                            type="submit" 
                            disabled={isChangingPass}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl font-bold disabled:opacity-50"
                          >
                            {isChangingPass ? 'ՄՇԱԿՎՈՒՄ Է...' : 'ՓՈԽԵԼ ԳԱՂՏՆԱԲԱՌԸ'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
