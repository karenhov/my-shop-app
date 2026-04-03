import { useState, useEffect, useRef, FormEvent } from 'react';
import type { RefObject } from 'react';
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

function ShareCartButtons({ cart, total, appliedPromo }: { cart: CartItem[], total: number, appliedPromo: PromoCode | null }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<'viber' | 'whatsapp' | 'telegram' | 'save' | null>(null);

  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
      setTimeout(() => resolve(null), 4000);
    });
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  };

  const generateImage = async (): Promise<string> => {
    const scale = 2;
    const W = 480;
    const PAD = 24;
    const IMG_SIZE = 80;
    const ROW_H = IMG_SIZE + 32;

    // Calculate total canvas height
    const headerH = 80;
    const footerH = 90;
    const totalH = headerH + cart.length * (ROW_H + 16) + footerH;

    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = totalH * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, totalH);

    // Header gradient bar
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 5);

    // Header title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${18 * 1}px sans-serif`;
    ctx.fillText('🛒  ԶԱՄԲՅՈՒՂ', PAD, 38);

    // Shop subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${12}px sans-serif`;
    ctx.fillText('Մեծածախ Վաճառք', PAD, 60);

    // Load all images in parallel
    const images = await Promise.all(cart.map(item => loadImage(item.image)));

    let y = headerH;

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const img = images[i];

      // Row background
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      roundRect(ctx, PAD, y, W - PAD * 2, ROW_H, 16);
      ctx.fill();

      // Product image
      if (img) {
        ctx.save();
        roundRect(ctx, PAD + 12, y + 12, IMG_SIZE, IMG_SIZE, 12);
        ctx.clip();
        ctx.drawImage(img, PAD + 12, y + 12, IMG_SIZE, IMG_SIZE);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, PAD + 12, y + 12, IMG_SIZE, IMG_SIZE, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `${11}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('📦', PAD + 12 + IMG_SIZE / 2, y + 12 + IMG_SIZE / 2 + 4);
        ctx.textAlign = 'left';
      }

      const textX = PAD + 12 + IMG_SIZE + 14;
      const textW = W - textX - PAD - 8;

      // Product name
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${13}px sans-serif`;
      wrapText(ctx, item.name, textX, y + 26, textW, 18);

      // Code badge
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, textX, y + 48, 90, 18, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `bold ${10}px sans-serif`;
      ctx.fillText(`ԿՈԴ: ${item.code}`, textX + 6, y + 61);

      // Quantity
      ctx.fillStyle = 'rgba(249,115,22,0.2)';
      roundRect(ctx, textX + 96, y + 48, 70, 18, 6);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.font = `bold ${10}px sans-serif`;
      ctx.fillText(`${item.quantity} հատ`, textX + 102, y + 61);

      // Price
      ctx.fillStyle = '#60a5fa';
      ctx.font = `bold ${14}px sans-serif`;
      ctx.fillText(`${(item.price * item.quantity).toLocaleString()} ֏`, textX, y + 88);

      // Unit price
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${10}px sans-serif`;
      ctx.fillText(`${item.price.toLocaleString()} ֏ × ${item.quantity}`, textX + 90, y + 88);

      y += ROW_H + 16;
    }

    // Footer divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y + 8);
    ctx.lineTo(W - PAD, y + 8);
    ctx.stroke();

    // Promo
    if (appliedPromo) {
      ctx.fillStyle = '#f97316';
      ctx.font = `bold ${13}px sans-serif`;
      const discount = Math.round(cart.reduce((s, i) => s + i.price * i.quantity, 0) * appliedPromo.discount_percent / 100);
      ctx.fillText(`Զեղչ ${appliedPromo.discount_percent}%:  -${discount.toLocaleString()} ֏`, PAD, y + 34);
    }

    // Total
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `${14}px sans-serif`;
    ctx.fillText('ԸՆԴՀԱՆՈՒՐ', PAD, y + 62);

    const totalGrad = ctx.createLinearGradient(0, 0, W, 0);
    totalGrad.addColorStop(0, '#2563eb');
    totalGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = totalGrad;
    ctx.font = `bold ${22}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${total.toLocaleString()} ֏`, W - PAD, y + 62);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleCapture = async (target: 'viber' | 'whatsapp' | 'telegram' | 'save') => {
    if (isCapturing) return;
    setIsCapturing(true);
    setShareTarget(target);
    try {
      const dataUrl = await generateImage();
      if (target === 'save') {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'zambyugh.png';
        a.click();
      } else {
        setPreviewUrl(dataUrl);
      }
    } catch (e) {
      console.error(e);
      alert('Սխալ տեղի ունեցավ, կրկին փորձեք');
    } finally {
      setIsCapturing(false);
    }
  };

  const getShareUrl = (app: 'viber' | 'whatsapp' | 'telegram') => {
    const text = encodeURIComponent('Ահա իմ զամբյուղը 🛒');
    if (app === 'viber') return `viber://forward?text=${text}`;
    if (app === 'whatsapp') return `https://wa.me/?text=${text}`;
    return `https://t.me/share/url?url=&text=${text}`;
  };

  const apps = [
    { key: 'viber' as const, label: 'Viber', color: 'bg-[#7360f2] hover:bg-[#6350e0]', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M11.4 0C5.5.1.6 4.5.1 10.3c-.3 3 .6 5.9 2.5 8.1l-.9 4.4 4.6-1.2c1.8.9 3.8 1.4 5.8 1.4h.1c6.2 0 11.3-5 11.4-11.2C23.7 5.2 18.3-.1 11.4 0zm.2 20.4c-1.8 0-3.5-.5-5-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.5-1.5-3.2-1.5-5C1.9 5.5 6.2 1.5 11.5 1.5c2.6 0 5 1 6.8 2.8 1.8 1.8 2.8 4.2 2.8 6.7-.1 5.3-4.4 9.4-9.5 9.4zm5.2-7c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.1 2 3 4.9 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.7.1.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3 0-.1-.3-.2-.5-.3z"/></svg> },
    { key: 'whatsapp' as const, label: 'WhatsApp', color: 'bg-[#25D366] hover:bg-[#20bd5a]', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { key: 'telegram' as const, label: 'Telegram', color: 'bg-[#0088cc] hover:bg-[#0077b3]', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  ];

  return (
    <>
      <div className="bg-white/5 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5">
        <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 flex items-center gap-2 text-white/80">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-400">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          ԿԻՍՎԵԼ ԶԱՄԲՅՈՒՂՈՎ
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {apps.map(app => (
            <button key={app.key} disabled={isCapturing} onClick={() => handleCapture(app.key)}
              className={`flex items-center gap-2 ${app.color} text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 hover:scale-105 shadow-lg disabled:opacity-50`}>
              {isCapturing && shareTarget === app.key ? <Loader2 size={14} className="animate-spin" /> : app.icon}
              {app.label}
            </button>
          ))}
          <button disabled={isCapturing} onClick={() => handleCapture('save')}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 hover:scale-105 shadow-lg border bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50">
            {isCapturing && shareTarget === 'save' ? <Loader2 size={14} className="animate-spin" /> : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            Պահպանել
          </button>
        </div>
        <p className="text-[10px] text-white/30 mt-3">* Կոճակը սեղմելուց կստանաք զամբյուղի նկարը</p>
      </div>

      <AnimatePresence>
        {previewUrl && shareTarget && shareTarget !== 'save' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-sm w-full bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <p className="font-bold text-sm">Զամբյուղի նկարը</p>
                <button onClick={() => setPreviewUrl(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto bg-black">
                <img src={previewUrl} alt="Cart" className="w-full" />
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-white/50 text-center">1. Ներբեռնեք նկարը &nbsp;→&nbsp; 2. Բացեք {apps.find(a => a.key === shareTarget)?.label} և ուղղարկեք</p>
                <div className="flex gap-2">
                  <button onClick={() => { const a = document.createElement('a'); a.href = previewUrl; a.download = 'zambyugh.png'; a.click(); }}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Ներբեռնել
                  </button>
                  <a href={getShareUrl(shareTarget)} target="_blank" rel="noopener noreferrer"
                    className={`flex-1 py-3 ${apps.find(a => a.key === shareTarget)?.color} rounded-2xl font-bold text-sm flex items-center justify-center gap-2`}>
                    {apps.find(a => a.key === shareTarget)?.icon}
                    Բացել
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
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
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean, type: string, isPostgres: boolean, error?: string } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passChangeData, setPassChangeData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const cartItemsRef = useRef<HTMLDivElement>(null);

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
                  <div ref={cartItemsRef} className="space-y-4 sm:space-y-6">
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
                  </div>
                  <ShareCartButtons cart={cart} total={calculateTotal()} appliedPromo={appliedPromo} />
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
