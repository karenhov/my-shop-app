import { useState, useEffect, useRef, FormEvent } from 'react';
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
  Loader2,
  Share2
} from 'lucide-react';
import { Product, CartItem, PromoCode, Order } from './types';
import { toPng } from 'html-to-image';

// ---- Viber SVG Icon (official phone + signal waves + speech bubble) ----
function ViberIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 70" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="58" height="54" rx="14" ry="14" fill="white" opacity="0.2"/>
      <path d="M14 55 Q10 66 8 70 Q18 63 24 55Z" fill="white" opacity="0.2"/>
      <path d="M43 38.5c-1-.5-5.8-2.9-6.7-3.2-.9-.3-1.5-.5-2.2.5-.6 1-2.5 3.2-3.1 3.8-.6.6-1.2.7-2.1.2-1-.5-4.2-1.5-8-4.9-3-2.6-5-5.9-5.5-6.9-.6-1-.1-1.5.4-2 .5-.5 1-1.1 1.5-1.7.5-.5.7-1 1-1.6.3-.7.1-1.3-.1-1.8-.2-.5-2.1-5.4-3-7.4-.8-1.9-1.6-1.6-2.2-1.6l-1.8-.04c-.6 0-1.7.2-2.6 1.2C10.4 14.2 8 16.5 8 20.8s3.5 9.6 4 10.2c.5.6 7 10.7 16.9 14.9 2.3 1 4.2 1.6 5.6 2.1 2.4.7 4.5.6 6.2.3 1.9-.3 5.9-2.4 6.7-4.7.8-2.3.8-4.3.6-4.7-.2-.5-.8-.8-1.9-1.4z" fill="white"/>
      <path d="M39 6 a16 16 0 0 1 0 22" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M44.5 1 a23 23 0 0 1 0 32" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>
  );
}

// ---- Share Cart via Viber / WhatsApp / Telegram ----
function ShareCartButtons({ cartSectionRef, cart, total, onClearCart }: {
  cartSectionRef: React.RefObject<HTMLDivElement>,
  cart: CartItem[],
  total: number,
  onClearCart: () => void,
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (cart.length === 0) return null;

  const captureAndShare = async (platform: 'viber' | 'whatsapp' | 'telegram') => {
    if (!cartSectionRef.current) return;
    setIsCapturing(true);
    setStatusMsg('Նկարը ստեղծվում է...');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Desktop-ում անմիջապես tab բացել (popup block-ից խուսափելու համար)
    const newTab = isMobile ? null : window.open('about:blank', '_blank');

    try {
      const dataUrl = await toPng(cartSectionRef.current, {
        backgroundColor: '#09090b',
        pixelRatio: 2,
        filter: (node: HTMLElement) => node.dataset?.shareIgnore !== 'true',
      });

      setStatusMsg('Վերբեռնվում է...');
      const response = await fetch('/api/upload-cart-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!response.ok) throw new Error('Upload failed');
      const { url: imageUrl } = await response.json();

      setStatusMsg('Բացվում է հավելվածը...');
      const msg = encodeURIComponent(`🛒 Զամբյուղ — ${total.toLocaleString()} ֏\n${imageUrl}`);
      const urls: Record<string, string> = {
        viber:    `viber://forward?text=${msg}`,
        whatsapp: `https://wa.me/?text=${msg}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(`🛒 Զամբյուղ — ${total.toLocaleString()} ֏`)}`,
      };
      if (isMobile) {
        window.location.href = urls[platform];
      } else if (newTab) {
        newTab.location.href = urls[platform];
      } else {
        window.open(urls[platform], '_blank');
      }
      // ── Ավտոմատ մաքրել զամբյուղը կիսվելուց հետո ──
      setTimeout(() => {
        onClearCart();
      }, 1500);
    } catch (err) {
      console.error('Share error:', err);
      if (newTab) newTab.close();
      setStatusMsg('Սխալ: ' + (err as Error).message);
      setTimeout(() => setStatusMsg(''), 3000);
    } finally {
      setIsCapturing(false);
      setTimeout(() => setStatusMsg(''), 2500);
    }
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} className="p-4 sm:p-5 rounded-2xl space-y-3" data-share-ignore="true">
      <p className="text-xs sm:text-sm font-bold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <Share2 size={14} /> ԿԻՍՎԵԼ ԶԱՄԲՅՈՒՂՈՎ
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Viber */}
        <button
          onClick={() => captureAndShare('viber')}
          disabled={isCapturing}
          className="flex flex-col items-center gap-1.5 py-3 sm:py-4 px-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#7360f2' }}
        >
          <ViberIcon size={24} />
          <span className="text-white text-[11px] sm:text-xs font-bold leading-none">Viber</span>
        </button>
        {/* WhatsApp */}
        <button
          onClick={() => captureAndShare('whatsapp')}
          disabled={isCapturing}
          className="flex flex-col items-center gap-1.5 py-3 sm:py-4 px-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#25d366' }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.34z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.1-1.34C8.48 21.53 10.21 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.71 0-3.3-.46-4.67-1.26l-.33-.2-3.03.8.81-2.96-.22-.35C3.46 15.25 3 13.68 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z"/>
          </svg>
          <span className="text-white text-[11px] sm:text-xs font-bold leading-none">WhatsApp</span>
        </button>
        {/* Telegram */}
        <button
          onClick={() => captureAndShare('telegram')}
          disabled={isCapturing}
          className="flex flex-col items-center gap-1.5 py-3 sm:py-4 px-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#2aabee' }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.94.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.63 4.72-4.27c.2-.18-.05-.28-.32-.1L7.4 14.47l-2.51-.78c-.55-.17-.56-.55.12-.82l9.82-3.79c.46-.17.86.11.81.72z"/>
          </svg>
          <span className="text-white text-[11px] sm:text-xs font-bold leading-none">Telegram</span>
        </button>
      </div>
      {isCapturing || statusMsg ? (
        <p className="text-center text-[11px] flex items-center justify-center gap-1.5 pt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {isCapturing && <Loader2 size={11} className="animate-spin" />}
          {statusMsg}
        </p>
      ) : null}
    </div>
  );
}

// ── Nav-ի մեջ փոքր share կոճակներ (միայն mobile, cart view-ում) ──
function NavShareButtons({ cartSectionRef, cart, total, setView, onClearCart }: {
  cartSectionRef: React.RefObject<HTMLDivElement>,
  cart: CartItem[],
  total: number,
  setView: (v: 'home' | 'categories' | 'products' | 'cart' | 'admin') => void,
  onClearCart: () => void,
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Desktop-ում չերևա (sm: և ավելի)
  // Եթե զամբյուղ դատարկ է — չերևա
  if (cart.length === 0) {
    return (
      <div className="sm:hidden flex-1 min-w-0 flex items-center gap-1.5">
        <Share2 size={13} style={{ color: '#f97316', flexShrink: 0 }} />
        <span
          className="text-xs font-black tracking-tight leading-tight"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Կիսվել<br/>Զամբյուղով
        </span>
      </div>
    );
  }

  const captureAndShare = async (platform: 'viber' | 'whatsapp' | 'telegram') => {
    setIsCapturing(true);
    setStatusMsg('Բեռնվում...');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const newTab = isMobile ? null : window.open('about:blank', '_blank');

    // Եթե cart view-ում չենք — նախ անցնել, սպասել DOM render-ին
    if (!cartSectionRef.current) {
      setView('cart');
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    if (!cartSectionRef.current) {
      if (newTab) newTab.close();
      setStatusMsg('Սխալ');
      setIsCapturing(false);
      setTimeout(() => setStatusMsg(''), 2000);
      return;
    }

    try {
      setStatusMsg('Ստեղծվում...');
      const dataUrl = await toPng(cartSectionRef.current, {
        backgroundColor: '#09090b',
        pixelRatio: 2,
        filter: (node: HTMLElement) => node.dataset?.shareIgnore !== 'true',
      });
      setStatusMsg('Վերբեռնում...');
      const response = await fetch('/api/upload-cart-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!response.ok) throw new Error('Upload failed');
      const { url: imageUrl } = await response.json();
      setStatusMsg('Բացվում...');
      const text = encodeURIComponent(`🛒 Զամբյուղ — ${total.toLocaleString()} ֏`);
      const encodedUrl = encodeURIComponent(imageUrl);
      const fullMsg = encodeURIComponent(`🛒 Զամբյուղ — ${total.toLocaleString()} ֏\n${imageUrl}`);
      const urls: Record<string, string> = {
        viber:    `viber://forward?text=${fullMsg}`,
        whatsapp: `https://wa.me/?text=${fullMsg}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      };
      if (isMobile) {
        window.location.href = urls[platform];
      } else if (newTab) {
        newTab.location.href = urls[platform];
      } else {
        window.open(urls[platform], '_blank');
      }
      // ── Ավտոմատ մաքրել զամբյուղը կիսվելուց հետո ──
      setTimeout(() => {
        onClearCart();
      }, 1500);
    } catch (err) {
      if (newTab) newTab.close();
      setStatusMsg('Սխալ');
      setTimeout(() => setStatusMsg(''), 2000);
    } finally {
      setIsCapturing(false);
      setTimeout(() => setStatusMsg(''), 2000);
    }
  };

  return (
    <div className="sm:hidden flex items-center gap-1.5 flex-1 min-w-0">
      {/* Share label + status */}
      <span className="flex items-center gap-1 text-[10px] font-bold shrink-0 min-w-[62px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {isCapturing ? (
          <><Loader2 size={11} className="animate-spin shrink-0" /><span className="leading-tight">{statusMsg}</span></>
        ) : statusMsg ? (
          <span className="leading-tight">{statusMsg}</span>
        ) : (
          <><Share2 size={11} className="shrink-0" /><span className="leading-tight">Կիսվել<br/>Զամբյուղով</span></>
        )}
      </span>

      {/* Icon-only կոճակներ */}
      <button
        onClick={() => captureAndShare('viber')}
        disabled={isCapturing}
        className="flex items-center justify-center p-2 rounded-xl active:scale-90 transition-all shrink-0"
        style={{ background: '#7360f2', opacity: isCapturing ? 0.5 : 1, width: 36, height: 36 }}
      >
        <ViberIcon size={18} />
      </button>
      <button
        onClick={() => captureAndShare('whatsapp')}
        disabled={isCapturing}
        className="flex items-center justify-center p-2 rounded-xl active:scale-90 transition-all shrink-0"
        style={{ background: '#25d366', opacity: isCapturing ? 0.5 : 1, width: 36, height: 36 }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.34z"/>
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.1-1.34C8.48 21.53 10.21 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.71 0-3.3-.46-4.67-1.26l-.33-.2-3.03.8.81-2.96-.22-.35C3.46 15.25 3 13.68 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z"/>
        </svg>
      </button>
      <button
        onClick={() => captureAndShare('telegram')}
        disabled={isCapturing}
        className="flex items-center justify-center p-2 rounded-xl active:scale-90 transition-all shrink-0"
        style={{ background: '#2aabee', opacity: isCapturing ? 0.5 : 1, width: 36, height: 36 }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.94.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.63 4.72-4.27c.2-.18-.05-.28-.32-.1L7.4 14.47l-2.51-.78c-.55-.17-.56-.55.12-.82l9.82-3.79c.46-.17.86.11.81.72z"/>
        </svg>
      </button>
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
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-b from-white/10 to-white/[0.02] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col hover:border-blue-500/30 transition-colors group">
      <div className="aspect-square overflow-hidden relative bg-zinc-900">
        <img src={product.image} alt={product.name} loading="eager" fetchPriority="high" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold tracking-widest uppercase border border-white/10">{product.code}</div>
      </div>
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-sm sm:text-lg mb-1 truncate group-hover:text-blue-400 transition-colors">{product.name}</h3>
        <p className="text-white/40 text-[10px] sm:text-xs mb-2 line-clamp-2">{product.description}</p>
        {product.min_quantity && product.min_quantity > 1 && <p className="text-[8px] sm:text-[10px] text-orange-400/80 font-bold mb-3 sm:mb-4 bg-orange-400/10 w-fit px-1.5 py-0.5 rounded-md">ՄԻՆ. ՔԱՆԱԿ: {product.min_quantity}</p>}
        <div className="mt-auto flex flex-col gap-2">
          <p className="text-sm sm:text-xl font-black text-white">{product.price.toLocaleString()} ֏</p>
          <button onClick={onAdd} className="w-full py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-90 flex items-center justify-center gap-1.5">
            {(product.category === 'sneakers' || product.category === 'slippers') ? (
              <><span className="text-[9px] xs:text-[10px] sm:text-xs font-bold leading-none">Ուղղարկել զամբյուղ</span><ShoppingCart size={11} className="xs:size-3 sm:size-[13px] shrink-0" /></>
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
  const [previousView, setPreviousView] = useState<'home' | 'categories' | 'products'>('categories');
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
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean, type: string, isPostgres: boolean, error?: string } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passChangeData, setPassChangeData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const cartSectionRef = useRef<HTMLDivElement>(null);

  const optimizeImageUrl = (url: string, width = 400, quality = 80) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
    }
    return url;
  };

  useEffect(() => {
    // Show info modal only on desktop (not mobile)
    const isMobile = window.innerWidth < 640;
    if (!isMobile) {
      setShowInfoModal(true);
      const timer = setTimeout(() => setShowInfoModal(false), 15000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
          // Preload all product images immediately
          data.forEach((product: Product) => {
            if (product.image) {
              const img = new Image();
              img.src = product.image;
            }
          });
        }
      })
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
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    setNotification(message);
    notificationTimer.current = setTimeout(() => setNotification(null), 2000);
  };

  const addToCart = (product: Product) => {
    const step = product.min_quantity || 1;
    // Հիշել վերջին էջը (products կամ home) զամբյուղ մտնելուց առաջ
    if (view === 'products' || view === 'home' || view === 'categories') {
      setPreviousView(view as 'home' | 'categories' | 'products');
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + step } : item);
      }
      return [...prev, { ...product, quantity: step }];
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
                <p>ԱՊՐԱՆՔԸ ԸՆՏՐԵԼԻՍ ՊԵՏՔ Է ՍԵՂՄԵԼ <span className="text-orange-400 font-bold">ՈՒՂՂԱՐԿԵԼ ԶԱՄԲՅՈՒՂ</span> ԿՈՃԱԿԸ:</p>
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Desktop: «Մեծածախ Վաճառք» տառեր */}
          <button onClick={() => setView('home')} className="hidden sm:block text-lg sm:text-xl font-bold tracking-tighter shrink-0">
            <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">Մեծածախ Վաճառք</span>
          </button>

          {/* Mobile: մինի share կոճակներ nav-ում */}
          <NavShareButtons cartSectionRef={cartSectionRef} cart={cart} total={calculateTotal()} setView={setView} onClearCart={() => setCart([])} />

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button onClick={() => setView('categories')} className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors">Ապրանքներ</button>
            <button onClick={() => { if (view !== 'cart' && view !== 'admin') setPreviousView(view as 'home' | 'categories' | 'products'); setView('cart'); }} className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
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
              <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
                {/* Վերադառնալ կոճակ */}
                <button
                  onClick={() => setView(previousView)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 hover:bg-white/10 shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Վերադառնալ</span>
                  <span className="sm:hidden">Հետ</span>
                </button>

                <h2 className="text-xl sm:text-3xl font-bold flex-1 text-center sm:text-left">ԶԱՄԲՅՈՒՂ</h2>

                {/* Մաքրել կոճակ */}
                <button
                  onClick={() => { if (confirm('Մաքրե՞լ զամբյուղը:')) setCart([]); }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 hover:bg-red-500/20 shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                  <span>ՄԱՔՐԵԼ</span>
                </button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-12 sm:py-20 border border-dashed border-white/10 rounded-3xl">
                  <ShoppingCart size={40} className="mx-auto mb-4 text-white/20 sm:size-12" />
                  <p className="text-white/40 text-sm sm:text-base">Ձեր զամբյուղը դատարկ է:</p>
                  <button onClick={() => setView('categories')} className="mt-4 sm:mt-6 text-blue-500 font-bold hover:text-blue-400 transition-colors text-sm sm:text-base">Գնալ գնումների</button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* ── CAPTURE ZONE — this section is screenshotted ── */}
                  <div ref={cartSectionRef} className="space-y-4 sm:space-y-5 bg-zinc-950 rounded-3xl p-3 sm:p-4">
                    <h2 className="text-xl sm:text-2xl font-bold px-1">ԶԱՄԲՅՈՒՂ</h2>
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3 sm:gap-4 bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/5">
                        <img src={optimizeImageUrl(item.image, 200)} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm sm:text-base truncate">{item.name}</h3>
                          <p className="text-[10px] sm:text-sm text-white/40">Կոդ: {item.code}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-blue-400 font-bold text-sm sm:text-base">{item.price.toLocaleString()} ֏</p>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div data-share-ignore="true" className="flex items-center gap-2 sm:gap-3">
                                <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-orange-500/20 transition-colors text-sm">-</button>
                              </div>
                              <span className="text-sm sm:text-base font-bold text-white">{item.quantity}</span>
                              <div data-share-ignore="true" className="flex items-center gap-2 sm:gap-3">
                                <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-blue-500/20 transition-colors text-sm">+</button>
                                <button onClick={() => removeFromCart(item.id)} className="ml-1 sm:ml-2 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-white/30 mt-1">Ընդամենը՝ {(item.price * item.quantity).toLocaleString()} ֏</p>
                        </div>
                      </div>
                    ))}
                    <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
                      {appliedPromo && <div className="flex justify-between text-xs sm:text-sm text-orange-400 mb-3"><span>Զեղչ ({appliedPromo.discount_percent}%)</span></div>}
                      <div className="flex justify-between text-lg sm:text-xl font-bold"><span>Ընդհանուր</span><span className="text-orange-500">{calculateTotal().toLocaleString()} ֏</span></div>
                    </div>
                  </div>
                  {/* ── END CAPTURE ZONE ── */}

                  {/* Promo code (outside capture zone) */}
                  <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3" data-share-ignore="true">
                    <div className="flex gap-2">
                      <input id="promo-input" type="text" placeholder="Պրոմոկոդ" className="flex-1 bg-black border border-white/10 rounded-xl px-3 sm:px-4 py-2 outline-none focus:border-blue-500 transition-colors text-sm sm:text-base" />
                      <button onClick={() => { const input = document.getElementById('promo-input') as HTMLInputElement; const found = promoCodes.find(p => p.code === input.value); if (found) { setAppliedPromo(found); input.value = ''; showNotification('Պրոմոկոդը կիրառվեց'); } else alert('Սխալ պրոմոկոդ'); }} className="px-3 sm:px-4 py-2 bg-blue-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-500 transition-all">ԿԻՐԱՌԵԼ</button>
                    </div>
                    {appliedPromo && <div className="flex justify-between text-xs sm:text-sm text-orange-400"><span>Զեղչ ({appliedPromo.discount_percent}%)</span><button onClick={() => setAppliedPromo(null)} className="underline hover:text-orange-300">Ջնջել</button></div>}
                  </div>

                  <ShareCartButtons cartSectionRef={cartSectionRef} cart={cart} total={calculateTotal()} onClearCart={() => setCart([])} />
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
