import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  User, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  Star, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Package, 
  Tag, 
  ClipboardList, 
  LogOut, 
  Edit2, 
  Image as ImageIcon,
  Loader2,
  Menu,
  Phone,
  MapPin,
  CheckCircle2,
  Info
} from 'lucide-react';
import { logoService } from './services/logoService';

// Types
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: 'sneakers' | 'slippers';
  description: string;
  code: string;
  min_quantity?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface PromoCode {
  id: number;
  code: string;
  discount_percent: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  total_price: number;
  created_at: string;
}

// Image Optimization Utility
const optimizeImageUrl = (url: string, width = 800, quality = 80) => {
  if (!url) return '';
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
  }
  return url;
};

export default function App() {
  const [view, setView] = useState<'home' | 'products' | 'cart' | 'admin'>('home');
  const [category, setCategory] = useState<'sneakers' | 'slippers' | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminView, setAdminView] = useState<'products' | 'promo' | 'orders'>('products');
  const [notification, setNotification] = useState<string | null>(null);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mock Data
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Nike Air Max Pro",
      price: 45000,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      category: 'sneakers',
      description: "Հարմարավետ և ոճային սպորտային կոշիկներ ամենօրյա օգտագործման համար:",
      code: "NK-001"
    },
    {
      id: 2,
      name: "Adidas Ultraboost",
      price: 52000,
      image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2",
      category: 'sneakers',
      description: "Պրեմիում դասի վազքի կոշիկներ առավելագույն հարմարավետությամբ:",
      code: "AD-002"
    },
    {
      id: 3,
      name: "Classic Comfort Slippers",
      price: 8500,
      image: "https://images.unsplash.com/photo-1603487742131-4160ec999306",
      category: 'slippers',
      description: "Փափուկ և տաք հողաթափեր տան համար:",
      code: "SL-003",
      min_quantity: 2
    }
  ]);

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    { id: 1, code: "WELCOME10", discount_percent: 10 },
    { id: 2, code: "SALE20", discount_percent: 20 }
  ]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pre-load images
  useEffect(() => {
    products.slice(0, 4).forEach(p => {
      const img = new Image();
      img.src = optimizeImageUrl(p.image, 600);
    });
  }, [products]);

  // Actions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: product.min_quantity || 1 }];
    });
    showNotification("Ավելացվեց զամբյուղ");
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const min = item.min_quantity || 1;
        const newQty = Math.max(min, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (appliedPromo) {
      return subtotal * (1 - appliedPromo.discount_percent / 100);
    }
    return subtotal;
  };

  const handleCheckout = async (customerData: any) => {
    setIsCheckingOut(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    
    const newOrder: Order = {
      id: Math.floor(Math.random() * 10000),
      ...customerData,
      items: cart,
      total_price: calculateTotal(),
      created_at: new Date().toISOString()
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedPromo(null);
    setView('home');
    setIsCheckingOut(false);
    showNotification("Պատվերը հաջողությամբ գրանցվեց");
  };

  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdminLogin = async (pass: string) => {
    setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 800));
    if (pass === 'admin123') {
      setAdminAuth(true);
      setAdminView('products');
    } else {
      alert('Սխալ գաղտնաբառ');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setAdminAuth(false);
    setView('home');
    setAdminPassInput('');
  };

  // Admin Actions
  const addProduct = (data: any) => {
    const newProduct = { ...data, id: Date.now() };
    setProducts(prev => [newProduct, ...prev]);
    showNotification("Ապրանքը ավելացվեց");
  };

  const updateProduct = (id: number, data: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...data, id } : p));
    setEditingProduct(null);
    showNotification("Ապրանքը թարմացվեց");
  };

  const deleteProduct = (id: number) => {
    if (confirm('Համոզվա՞ծ եք:')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const addPromo = (data: any) => {
    setPromoCodes(prev => [...prev, { ...data, id: Date.now() }]);
  };

  const deletePromo = (id: number) => {
    setPromoCodes(prev => prev.filter(p => p.id !== id));
  };

  const deleteOrder = (id: number) => {
    if (confirm('Ջնջե՞լ պատվերը:')) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const filteredProducts = category 
    ? products.filter(p => p.category === category)
    : products;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
          >
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-2xl shadow-orange-500/20 flex items-center gap-3 border border-white/20">
              <CheckCircle2 size={20} className="text-white" />
              <span className="font-black text-xs sm:text-sm uppercase tracking-widest">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-orange-500" />
              <button onClick={() => setShowInfoModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
              
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2 tracking-tighter">ԿՈՆՏԱԿՏՆԵՐ</h2>
                  <p className="text-white/40 text-sm">Մենք միշտ պատրաստ ենք օգնել Ձեզ</p>
                </div>

                <div className="space-y-4">
                  <a href="tel:+37400000000" className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all group">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Հեռախոս</p>
                      <p className="text-lg font-bold">+374 (00) 00-00-00</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Հասցե</p>
                      <p className="text-lg font-bold">Երևան, Հայաստան</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg hover:bg-orange-500 hover:text-white transition-all"
                >
                  ՓԱԿԵԼ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
            <button 
              onClick={() => { setView('home'); setCategory(null); setIsMenuOpen(false); }} 
              className="flex items-center gap-2 sm:gap-3 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <ShoppingBag className="text-white" size={20} />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter">MY SHOP</span>
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => { setView('products'); setCategory('sneakers'); }} className={`text-sm font-bold tracking-widest uppercase transition-colors ${category === 'sneakers' ? 'text-blue-500' : 'text-white/60 hover:text-white'}`}>Կոշիկներ</button>
              <button onClick={() => { setView('products'); setCategory('slippers'); }} className={`text-sm font-bold tracking-widest uppercase transition-colors ${category === 'slippers' ? 'text-blue-500' : 'text-white/60 hover:text-white'}`}>Հողաթափեր</button>
              <button onClick={() => setShowInfoModal(true)} className="text-sm font-bold tracking-widest uppercase text-white/60 hover:text-white transition-colors">Կոնտակտներ</button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setView('cart')} 
                className="relative p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center border-2 border-black">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setView('admin')} 
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-colors ${view === 'admin' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
              >
                <User size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-white/60"
              >
                <Menu size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 bg-zinc-900 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <button onClick={() => { setView('products'); setCategory('sneakers'); setIsMenuOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl bg-white/5 font-bold">ԿՈՇԻԿՆԵՐ</button>
                <button onClick={() => { setView('products'); setCategory('slippers'); setIsMenuOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl bg-white/5 font-bold">ՀՈՂԱԹԱՓԵՐ</button>
                <button onClick={() => { setShowInfoModal(true); setIsMenuOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl bg-white/5 font-bold">ԿՈՆՏԱԿՏՆԵՐ</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 md:pt-40 pb-20">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 sm:space-y-20 md:space-y-32"
            >
              {/* Hero Section */}
              <section className="relative rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden bg-zinc-900 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center">
                <img 
                  src={optimizeImageUrl("https://images.unsplash.com/photo-1552346154-21d32810aba3", 1920)} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                <div className="relative z-10 px-8 sm:px-12 md:px-20 max-w-3xl">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="inline-block bg-blue-600 px-4 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-[0.2em] mb-4 sm:mb-6">ՆՈՐ ՀԱՎԱՔԱԾՈՒ</span>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-6 sm:mb-8">
                      ՔԱՅԼԻՐ <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500">ՎՍՏԱՀ</span>
                    </h1>
                    <p className="text-white/60 text-sm sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-md leading-relaxed">
                      Բացահայտեք հարմարավետության և ոճի կատարյալ համադրությունը մեր նոր տեսականու հետ:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => { setView('products'); setCategory('sneakers'); }}
                        className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-black rounded-2xl font-black text-sm sm:text-lg hover:bg-orange-500 hover:text-white transition-all active:scale-95"
                      >
                        ԳՆԵԼ ՀԻՄԱ
                      </button>
                      <button 
                        onClick={() => setShowInfoModal(true)}
                        className="px-8 sm:px-10 py-4 sm:py-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl font-black text-sm sm:text-lg hover:bg-white/20 transition-all"
                      >
                        ԿԱՊ ՄԵԶ ՀԵՏ
                      </button>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Categories Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                <CategoryCard 
                  title="ՍՊՈՐՏԱՅԻՆ ԿՈՇԻԿՆԵՐ" 
                  image="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a"
                  onClick={() => { setView('products'); setCategory('sneakers'); }}
                />
                <CategoryCard 
                  title="ՀՈՂԱԹԱՓԵՐ" 
                  image="https://images.unsplash.com/photo-1603487742131-4160ec999306"
                  onClick={() => { setView('products'); setCategory('slippers'); }}
                />
              </section>

              {/* Features */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                <FeatureCard icon={<Truck className="text-blue-500" size={32} />} title="ԱՐԱԳ ԱՌԱՔՈՒՄ" desc="Առաքում ողջ ՀՀ տարածքում" />
                <FeatureCard icon={<ShieldCheck className="text-orange-500" size={32} />} title="ՈՐԱԿԻ ԵՐԱՇԽԻՔ" desc="Միայն լավագույն ապրանքները" />
                <FeatureCard icon={<Clock className="text-blue-500" size={32} />} title="24/7 ԱՋԱԿՑՈՒԹՅՈՒՆ" desc="Միշտ պատրաստ ենք օգնել" />
                <FeatureCard icon={<Star className="text-orange-500" size={32} />} title="ԼԱՎԱԳՈՒՅՆ ԳՆԵՐ" desc="Մատչելիություն և որակ" />
              </section>

              {/* Promo Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <CategoryActionCard 
                  title="ԶԵՂՉԱՅԻՆ ՀԱՄԱԿԱՐԳ" 
                  desc="Օգտագործեք WELCOME10 պրոմոկոդը առաջին գնման համար"
                  color="bg-gradient-to-br from-blue-900 to-blue-600"
                  onClick={() => setView('products')}
                />
                <CategoryActionCard 
                  title="ՄԵԾԱԾԱԽ ՎԱՃԱՌՔ" 
                  desc="Հատուկ պայմաններ մեծաքանակ պատվերների համար"
                  color="bg-gradient-to-br from-zinc-800 to-zinc-900"
                  onClick={() => setShowInfoModal(true)}
                />
              </section>
            </motion.div>
          )}

          {view === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase">
                    {category === 'sneakers' ? 'Կոշիկներ' : category === 'slippers' ? 'Հողաթափեր' : 'Տեսականի'}
                  </h2>
                  <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-orange-500 mt-4 rounded-full" />
                </div>
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setCategory(null)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${!category ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    ԲՈԼՈՐԸ
                  </button>
                  <button 
                    onClick={() => setCategory('sneakers')}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${category === 'sneakers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white'}`}
                  >
                    ԿՈՇԻԿՆԵՐ
                  </button>
                  <button 
                    onClick={() => setCategory('slippers')}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${category === 'slippers' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
                  >
                    ՀՈՂԱԹԱՓԵՐ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
                {filteredProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} priority={idx < 4} />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">ԶԱՄԲՅՈՒՂ</h2>
                <button onClick={() => setView('products')} className="text-blue-500 font-bold flex items-center gap-2 hover:gap-4 transition-all">
                  ՇԱՐՈՒՆԱԿԵԼ ԳՆՈՒՄՆԵՐԸ <ChevronRight size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 sm:py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                    <ShoppingBag size={40} className="text-white/20 sm:w-12 sm:h-12" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">Ձեր զամբյուղը դատարկ է</h3>
                  <button 
                    onClick={() => setView('products')}
                    className="px-8 sm:px-10 py-4 bg-white text-black rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all"
                  >
                    ԳՆԱԼ ԽԱՆՈՒԹ
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <div className="space-y-4 sm:space-y-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4 sm:gap-6 bg-white/5 p-4 sm:p-6 rounded-3xl border border-white/5 group">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-zinc-900 rounded-2xl overflow-hidden flex-shrink-0">
                          <img src={optimizeImageUrl(item.image, 200)} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-sm sm:text-lg truncate">{item.name}</h3>
                            <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-blue-500 font-black text-sm sm:text-base mb-3 sm:mb-4">{item.price.toLocaleString()} ֏</p>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center bg-black rounded-xl border border-white/10 p-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 sm:p-2 hover:text-blue-500 transition-colors"><Minus size={16} /></button>
                              <span className="w-8 sm:w-10 text-center font-bold text-sm sm:text-base">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 sm:p-2 hover:text-blue-500 transition-colors"><Plus size={16} /></button>
                            </div>
                            <span className="text-xs sm:text-sm text-white/40">Ընդհանուր: {(item.price * item.quantity).toLocaleString()} ֏</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="bg-white/5 p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-4">
                      <div className="flex gap-2">
                        <input 
                          id="promo-input"
                          type="text" 
                          placeholder="Պրոմոկոդ"
                          className="flex-1 bg-black border border-white/10 rounded-xl px-3 sm:px-4 py-2 outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const code = (e.target as HTMLInputElement).value;
                              const found = promoCodes.find(p => p.code === code);
                              if (found) {
                                setAppliedPromo(found);
                                (e.target as HTMLInputElement).value = '';
                                showNotification('Պրոմոկոդը կիրառվեց');
                              } else {
                                alert('Սխալ պրոմոկոդ');
                              }
                            }
                          }}
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('promo-input') as HTMLInputElement;
                            const code = input.value;
                            const found = promoCodes.find(p => p.code === code);
                            if (found) {
                              setAppliedPromo(found);
                              input.value = '';
                              showNotification('Պրոմոկոդը կիրառվեց');
                            } else {
                              alert('Սխալ պրոմոկոդ');
                            }
                          }}
                          className="px-3 sm:px-4 py-2 bg-blue-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-500 transition-all"
                        >
                          ԿԻՐԱՌԵԼ
                        </button>
                      </div>
                      {appliedPromo && (
                        <div className="flex justify-between text-xs sm:text-sm text-orange-400">
                          <span>Զեղչ ({appliedPromo.discount_percent}%)</span>
                          <button onClick={() => setAppliedPromo(null)} className="underline hover:text-orange-300">Ջնջել</button>
                        </div>
                      )}
                      <div className="flex justify-between text-lg sm:text-xl font-bold pt-4 border-t border-white/10">
                        <span>Ընդհանուր</span>
                        <span className="text-orange-500">{calculateTotal().toLocaleString()} ֏</span>
                      </div>
                    </div>

                    <CheckoutForm onSubmit={handleCheckout} isLoading={isCheckingOut} />
                  </div>
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
                    <button onClick={() => handleAdminLogin(adminPassInput)} disabled={isLoggingIn} className="w-full py-4 bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50">
                      {isLoggingIn ? 'ՄՈՒՏՔ...' : 'ՄՈՒՏՔ'}
                    </button>
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
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold px-4 py-2 hover:bg-red-500/10 rounded-xl transition-colors">
                      <LogOut size={18} /> Ելք
                    </button>
                  </div>

                  {adminView === 'products' && (
                    <div className="space-y-8">
                      {editingProduct ? (
                        <div className="bg-white/5 p-6 rounded-3xl border border-blue-500/30">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">ԽՄԲԱԳՐԵԼ ԱՊՐԱՆՔԸ</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-white/40"><X size={20} /></button>
                          </div>
                          <AddProductForm initialData={editingProduct} onAdd={(data) => updateProduct(editingProduct.id, data)} isEdit />
                        </div>
                      ) : (
                        <AddProductForm onAdd={addProduct} />
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(products) && products.map(p => (
                          <div key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="w-16 h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={optimizeImageUrl(p.image, 100)} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" crossOrigin="anonymous" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{p.name}</p>
                              <p className="text-xs text-white/40">{p.category === 'sneakers' ? 'Կոշիկ' : 'Հողաթափ'}</p>
                            </div>
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
                            <div>
                              <p className="font-bold text-blue-400">{p.code}</p>
                              <p className="text-sm text-white/40">{p.discount_percent}% զեղչ</p>
                            </div>
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
                            <div>
                              <p className="text-sm text-white/40">Պատվեր #{order.id}</p>
                              <p className="font-bold text-lg">{order.customer_name}</p>
                              <p className="text-sm">{order.customer_phone}</p>
                              <p className="text-sm text-white/60">{order.customer_address}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <button onClick={() => deleteOrder(order.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                              <p className="text-xs text-white/20">{new Date(order.created_at).toLocaleString('hy-AM')}</p>
                              <p className="text-2xl font-black text-blue-500">{order.total_price.toLocaleString()} ֏</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {order.items.map(item => (
                              <div key={item.id} className="flex gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden">
                                  <img src={optimizeImageUrl(item.image, 100)} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" crossOrigin="anonymous" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold truncate">{item.name}</p>
                                  <p className="text-[10px] text-white/40">Կոդ: {item.code} | Քանակ: {item.quantity}</p>
                                  <p className="text-xs text-orange-400">{item.price_at_time.toLocaleString()} ֏</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
    <button onClick={onClick} className={`${color} p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] text-left flex flex-col justify-between min-h-[180px] sm:min-h-[240px] md:min-h-[300px] hover:scale-[1.02] transition-transform shadow-2xl group w-full`}>
      <div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-2">{title}</h3>
        <p className="text-white/70 text-xs sm:text-sm md:text-base font-medium max-w-[200px]">{desc}</p>
      </div>
      <div className="mt-4 sm:mt-6 md:mt-8">
        <span className="bg-gradient-to-r from-blue-500/40 to-orange-500/40 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs md:text-sm group-hover:from-blue-500/60 group-hover:to-orange-500/60 transition-all">Դիտել →</span>
      </div>
    </button>
  );
}

function CategoryCard({ title, image, onClick }: { title: string, image: string, onClick: () => void }) {
  const optimizeImageUrl = (url: string, width = 800, quality = 80) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
    }
    return url;
  };
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="relative h-56 sm:h-80 md:h-[350px] lg:h-[450px] rounded-[2rem] overflow-hidden group bg-zinc-900 w-full">
      <img src={optimizeImageUrl(image, 1000)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" loading="lazy" crossOrigin="anonymous" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-left">
        <h3 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none">{title}</h3>
        <p className="text-blue-400 text-xs sm:text-sm font-bold mt-2 flex items-center gap-2">ԴԻՏԵԼ <Plus size={16} /></p>
      </div>
    </motion.button>
  );
}

function ProductCard({ product, onAdd, priority }: { product: Product, onAdd: () => void, priority?: boolean }) {
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
    <motion.div initial={priority ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} whileInView={priority ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-b from-white/10 to-white/[0.02] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col hover:border-blue-500/30 transition-colors group">
      <div className="aspect-square overflow-hidden relative bg-zinc-900">
        {!isLoaded && !priority && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse"><ImageIcon className="text-white/10" size={24} /></div>}
        <img src={optimizeImageUrl(product.image, priority ? 600 : 400)} alt={product.name} onLoad={() => setIsLoaded(true)} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${priority || isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} referrerPolicy="no-referrer" crossOrigin="anonymous" />
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold tracking-widest uppercase border border-white/10">{product.code}</div>
      </div>
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-sm sm:text-lg mb-1 truncate group-hover:text-blue-400 transition-colors">{product.name}</h3>
        <p className="text-white/40 text-[10px] sm:text-xs mb-2 line-clamp-2">{product.description}</p>
        {product.min_quantity && product.min_quantity > 1 && <p className="text-[8px] sm:text-[10px] text-orange-400/80 font-bold mb-3 sm:mb-4 bg-orange-400/10 w-fit px-1.5 py-0.5 rounded-md">ՄԻՆ. ՔԱՆԱԿ: {product.min_quantity}</p>}
        <div className="mt-auto flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
          <p className="text-sm sm:text-xl font-black text-white">{product.price.toLocaleString()} ֏</p>
          <button onClick={onAdd} className="w-full xs:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-90 flex items-center justify-center">
            <span className="text-[10px] sm:text-xs font-bold">Ավելացնել</span>
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
      <button type="submit" disabled={isLoading} className="w-full py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
        {isLoading ? <><Loader2 className="animate-spin" size={20} /> ՄՇԱԿՎՈՒՄ Է...</> : 'ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ'}
      </button>
    </form>
  );
}

function AdminNavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${active ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white' : 'text-white/40 hover:bg-white/5'}`}>
      {icon} {label}
    </button>
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
      <select name="category" defaultValue={initialData?.category} className="col-span-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500">
        <option value="sneakers">Սպորտային կոշիկներ</option>
        <option value="slippers">Հողաթափեր</option>
      </select>
      <input name="image" defaultValue={initialData?.image} placeholder="Նկարի URL" required className="col-span-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      <textarea name="description" defaultValue={initialData?.description} placeholder="Նկարագրություն" className="col-span-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 h-24" />
      <button type="submit" className={`col-span-full py-4 rounded-xl font-bold ${isEdit ? 'bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-orange-500'}`}>
        {isEdit ? 'ՊԱՀՊԱՆԵԼ' : 'ԱՎԵԼԱՑՆԵԼ'}
      </button>
    </form>
  );
}

function AddPromoForm({ onAdd }: { onAdd: (data: any) => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const data = Object.fromEntries(formData); onAdd({ ...data, discount_percent: Number(data.discount_percent) }); (e.target as HTMLFormElement).reset(); }} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs text-white/40 mb-1 ml-2">ՊՐՈՄՈԿՈԴ</label>
        <input name="code" placeholder="Օրինակ` SALE20" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      </div>
      <div className="w-32">
        <label className="block text-xs text-white/40 mb-1 ml-2">ԶԵՂՉ %</label>
        <input name="discount_percent" type="number" placeholder="20" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
      </div>
      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold h-[50px]">ԱՎԵԼԱՑՆԵԼ</button>
    </form>
  );
}
