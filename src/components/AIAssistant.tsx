import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessagesSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Local FAQ Database for fallback
const FAQ_DATA = [
  {
    keywords: ['զամбüλх', 'basket', 'ав\u0565\u056c\u0561\u0581\u0576\u0565\u056c', 'ջнджел'],
    answer: "🛒 **Замбюлхи** бажины гтнвум е каjки верево aji анкютнум: Апранк авелацнелу хамар семек **'Ударкарел замбюлх'** кочакы: Аjнтеgh карог ек фохел квантутюны кам джнджел апранкы:"
  },
  {
    keywords: ['патвер', 'order', '\u0570\u0561\u057d\u057f\u0561\u057f\u0565\u056c', '\u0563\u0576\u0565\u056c'],
    answer: "📦 **Патверы** дзевакерпелу хамар мтек замбюлх, лрацрек ձер тваjалнеры ев семек **'ХАСТАТЕЛЬ ПАТВЕРЫ'**: Дранич хето карог ек капнвел мез хет Viber-ов кам Telegram-ов:"
  },
  {
    keywords: ['кап', 'админ', 'херахос', 'viber', 'whatsapp', 'telegram'],
    answer: "📞 Мез хет карог ек капнвел **Viber**, **WhatsApp** кам **Telegram** хавелвацнери мidзоцов: Кочакнеры каjтнвум ен замбюлхум апранк авелацнелуц хето, кам карог ек огтагордвел неркеви навигационаjин торгы **'АДМИН'** бажнич:"
  },
  {
    keywords: ['\u0576\u056f\u0561\u0580', 'мецацнел', 'дитель'],
    answer: "🖼️ Нкары мец дителу хамар **семец кац нкари врà**: Ете нкары чи бацвум, пнтрек тарміаценел еджы:"
  },
  {
    keywords: ['зелч', 'промокод', 'promo'],
    answer: "🎫 **Промокоды** нахатесвац е зелчери хамар: Аjн карог ек станал мер администраторич:"
  },
  {
    keywords: ['\u0562\u0561\u0580\u0587', '\u0578\u056[ гдж', 'hi', 'hello'],
    answer: "Ողջưн! Ес EdgSport-и AI огнаканн ем: Инчо՞в карог ем огнел ձеz:"
  }
];

const getLocalFallbackResponse = (query: string, products: any[]) => {
  const lowerQuery = query.toLowerCase();

  for (const item of FAQ_DATA) {
    if (item.keywords.some(key => lowerQuery.includes(key.toLowerCase()))) {
      return item.answer;
    }
  }

  const foundProducts = products.filter(p =>
    p.code && lowerQuery.includes(p.code.toLowerCase()) ||
    p.name && lowerQuery.includes(p.name.toLowerCase())
  ).slice(0, 3);

  if (foundProducts.length > 0) {
    let resp = "Ахаа ձер пнтрац апранкнеры:\n\n";
    foundProducts.forEach((p: any) => {
      resp += `🔹 **${p.name}**\n💰 Гин: ${p.price} драм\n🔢 Код: ${p.code}\n\n`;
    });
    return resp;
  }

  return "Кнерек, ес чкарогацна гтнел конкрет патаскхан ձер харцин: Хndrum ем пнтрек оgтватвел ми пок уш, ерб AI хамакарге норицс хасанели лини:";
};

export function AIAssistant({ products = [] }: { products?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ողջуն! Ес ձер AI оgнаканн ем: Инchpes karоg еm оgnel ձеz аjsor:' }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      if (!localStorage.getItem('ai_assistant_welcomed')) {
        const t = setTimeout(() => setShowBubble(true), 3000);
        return () => clearTimeout(t);
      }
    } catch { /* localStorage blocked */ }
  }, []);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const closeBubble = () => {
    setShowBubble(false);
    try { localStorage.setItem('ai_assistant_welcomed', 'true'); } catch { /* ignore */ }
  };

  const handleToggle = () => {
    if (!isOpen && showBubble) closeBubble();
    setIsOpen(prev => !prev);
  };

  const handleSend = async () => {
    const input = userMessage.trim();
    if (!input || isLoading) return;

    setIsLoading(true);
    setUserMessage('');
    setMessages(prev => [
      ...prev,
      { role: 'user', content: input },
      { role: 'assistant', content: '' },
    ]);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const productData = products.slice(0, 10).map((p: any) => ({
        name: p.name, price: p.price, code: p.code, category: p.category,
      }));

      const systemInstruction = `Duq "EdgSport" xanuti profesional AI oghnakann eq. Pataskhanek MIAIN hayereni. Pataskhanery linin konkret.

Karevory:
1. "Ditel Teskanin" kochak -> Sportayin Koshikner / Hoghataper bazhinnerits endel
2. "Udarkarel zambyulh" kochak -> apranky zambyulh aveli
3. Zambyulx: verevum ajin ankiutnum. Quantity, djnjel.
4. Viber/WhatsApp/Telegram -> zambyulhum erb apranq kan
5. "HASTATELI PATVERY" -> patver dzevakerpel

Apranqner: ${JSON.stringify(productData)}

Hosek miain hayereni. Karevory dartsrek bold.`;

      // Build conversation history (exclude last empty assistant placeholder)
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      history.push({ role: 'user', parts: [{ text: input }] });

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({ messages: history, systemInstruction }),
      });

      if (ctrl.signal.aborted) return;

      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data.text || '';
      }
      if (!reply) {
        reply = getLocalFallbackResponse(input, products);
      }

      // Typewriter
      let built = '';
      for (let i = 0; i < reply.length; i++) {
        if (ctrl.signal.aborted) break;
        built += reply[i];
        const snap = built;
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: snap };
          return copy;
        });
        await new Promise(r => setTimeout(r, 12));
      }

    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const fallback = getLocalFallbackResponse(input, products);
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: fallback };
        else copy.push({ role: 'assistant', content: fallback });
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="ai-assistant-container relative inline-block z-[60]">
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute top-full right-0 mt-3 bg-white text-black p-3 rounded-2xl rounded-tr-none shadow-2xl border border-gray-200 z-[100] w-[200px] sm:w-[250px] pointer-events-auto"
            >
              <button onClick={(e) => { e.stopPropagation(); closeBubble(); }}
                className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg z-[110]">
                <X size={12} />
              </button>
              <p className="text-[11px] sm:text-xs font-bold leading-tight text-gray-800">
                Ողջун! Ес ձер AI оgнаканн ем: Каро՞g еm оgнel ձеz:
              </p>
              <div className="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors group cursor-pointer z-[70]"
          title="AI Оgнакан" type="button"
        >
          <MessagesSquare size={20} className="text-white/80 group-hover:text-white transition-colors" />
          <Sparkles size={10} className="absolute top-1 right-1 text-yellow-400 animate-pulse" />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex flex-col sm:items-end sm:justify-start sm:p-4 sm:pt-20 pointer-events-none">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 50, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full h-full sm:w-[400px] sm:h-[calc(100vh-120px)] sm:max-h-[700px] bg-[#09090b] border-none sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-[#3b82f6] to-[#f97316] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-white">
                    <div className="p-1.5 bg-white/20 rounded-lg"><Bot size={20} /></div>
                    <div>
                      <h3 className="font-bold text-sm">AI Оgнакан</h3>
                      <p className="text-[10px] opacity-80">Мишт патраст оgнелу</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
                  {messages.map((msg, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`mt-1 p-1 rounded-full flex-shrink-0 h-fit ${msg.role === 'user' ? 'bg-[#3b82f6]' : 'bg-[#f97316]'}`}>
                          {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm markdown-content shadow-lg ${
                          msg.role === 'user'
                            ? 'bg-[#3b82f6] text-white rounded-tr-none'
                            : 'bg-zinc-800 text-white border border-white/10 rounded-tl-none'
                        }`}>
                          {msg.content
                            ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                            : isLoading && idx === messages.length - 1
                              ? <Loader2 size={14} className="animate-spin text-[#f97316]" />
                              : null
                          }
                          {isLoading && idx === messages.length - 1 && msg.role === 'assistant' && msg.content && (
                            <span className="typing-cursor" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative flex items-center gap-2">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="Грек ձер харцы..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                    <button type="submit" disabled={!userMessage.trim() || isLoading}
                      className="absolute right-1.5 p-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:hover:bg-[#3b82f6] text-white rounded-lg transition-all">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .markdown-content p { margin-bottom: 8px; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .typing-cursor::after { content:'▋'; display:inline-block; vertical-align:middle; animation:blink 1s step-end infinite; margin-left:2px; color:#f97316; }
        @keyframes blink { from,to{opacity:1} 50%{opacity:0} }
      `}} />
    </>
  );
}
