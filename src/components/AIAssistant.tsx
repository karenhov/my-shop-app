import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessagesSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ========== ENHANCED LOCAL FAQ DATABASE ==========
// Այս բազան օգտագործվում է երբ API-ն հասանելի չէ կամ լիմիտը լրացել է
const FAQ_DATA = [
  {
    keywords: ['բարև', 'ողջույն', 'hi', 'hello', 'barev'],
    answer: "👋 Ողջույն! Ես **EdgSport** խանութի AI օգնականն եմ։ Ինչո՞վ կարող եմ օգնել ձեզ այսօր։"
  },
  {
    keywords: ['օգնություն', 'help', 'ինչպե՞ս', 'ինչպես'],
    answer: "ℹ️ Ես կարող եմ օգնել ձեզ.\n\n🛒 **Զամբյուղի** և պատվերի հետ\n📦 **Ապրանքների** մասին տեղեկություններ\n🔍 **Կայքում նավիգացիա**\n💬 **Կապի** միջոցներ\n\nՍեղմեք վերևի մենյուի **«ԲԱԺԻՆՆԵՐ»** կոճակը՝ տեսականին դիտելու համար։"
  },
  {
    keywords: ['զամբյուղ', 'basket', 'cart', 'ավելացնել', 'ջնջել', 'քանակ'],
    answer: "🛒 **Զամբյուղի** օգտագործում.\n\n1️⃣ Ապրանք ընտրելու համար սեղմեք **«ՈՒՂՂԱՐԿԵԼ ԶԱՄԲՅՈՒՂ»** կոճակը\n2️⃣ Զամբյուղը գտնվում է վերևի աջ անկյունում 🛒\n3️⃣ Այնտեղ կարող եք՝\n   • Փոխել քանակները **+ / -** կոճակներով\n   • Ջնջել ապրանքները 🗑️\n   • Դիտել ընդհանուր գումարը"
  },
  {
    keywords: ['պատվեր', 'order', 'հաստատել', 'գնել', 'ձևակերպել'],
    answer: "📦 **Պատվերի** ձևակերպում.\n\n1️⃣ Մտեք **ԶԱՄԲՅՈՒՂ** բաժին\n2️⃣ Լրացրեք ձեր տվյալները՝\n   • Անուն Ազգանուն\n   • Հեռախոսահամար\n   • Հասցե\n3️⃣ Սեղմեք **«ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ»**\n4️⃣ Կապնվեք մեզ հետ **Viber/Telegram** միջոցով"
  },
  {
    keywords: ['կապ', 'ադմին', 'հեռախոս', 'viber', 'whatsapp', 'telegram', 'կապվել'],
    answer: "📞 **Կապի** միջոցներ.\n\n💬 Մեզ հետ կարող եք կապնվել՝\n• **Viber**\n• **WhatsApp**\n• **Telegram**\n\nԿոճակները հայտնվում են զամբյուղում՝ երբ այնտեղ կա առնվազն **1 ապրանք**։ Կամ օգտվեք **«ԱԴՄԻՆ»** բաժնից։"
  },
  {
    keywords: ['կիսվել', 'share', 'ուղարկել'],
    answer: "📤 **Զամբյուղով կիսվելը**.\n\n🎯 **Viber**, **WhatsApp** կամ **Telegram** կոճակները հայտնվում են զամբյուղում՝ երբ այնտեղ կա **առնվազն 1 ապրանք**։\n\n✅ Սեղմեք մեկին՝ ձեր ընտրած ապրանքների նկարը և տեղեկությունները ուղարկելու համար։"
  },
  {
    keywords: ['նկար', 'մեծացնել', 'դիտել', 'տեսնել', 'photo'],
    answer: "🖼️ **Նկարների** դիտում.\n\n📱 Նկարը մեծ դիտելու համար՝\n• **Սեղմած պահեք** նկարի վրա\n• Հետո ընտրեք մեծացնելու տարբերակը\n\n⚠️ Եթե նկարները չեն բացվում՝ թարմացրեք էջը (F5)"
  },
  {
    keywords: ['զեղչ', 'պրոմոկոդ', 'promo', 'discount', 'արժեղչում'],
    answer: "🎫 **Պրոմոկոդի** օգտագործում.\n\n1️⃣ Պրոմոկոդը ստանալ ադմինիստրատորից\n2️⃣ Մտեք **ԶԱՄԲՅՈՒՂ** բաժին\n3️⃣ Գրեք պրոմոկոդը համապատասխան դաշտում\n4️⃣ Սեղմեք **«ԿԻՐԱՌԵԼ»**\n\n✨ Զեղչը ավտոմատ հաշվարկվելու է։"
  },
  {
    keywords: ['ապրանք', 'տեսականի', 'product', 'ինչ կա', 'կոշիկ', 'հողաթափ'],
    answer: "👟 **Մեր տեսականին**.\n\n📂 Ունենք երկու հիմնական բաժին՝\n\n1️⃣ **ՍՊՈՐՏԱՅԻՆ ԿՈՇԻԿՆԵՐ**\n   • Բարձրորակ սպորտային մոդելներ\n   • Մեծածախ գներ\n\n2️⃣ **ՀՈՂԱԹԱՓԵՐ**\n   • Ամենօրյա և աշխատանքային\n   • Լայն տեսականի\n\n🔍 Դիտելու համար՝ սեղմեք **«ԴԻՏԵԼ ՏԵՍԱԿԱՆԻՆ»** կոճակը գլխավոր էջում։"
  },
  {
    keywords: ['գին', 'price', 'արժե', 'փող', 'դրամ'],
    answer: "💰 **Գների** մասին.\n\n✅ Յուրաքանչյուր ապրանքի գինը նշված է դրամով (֏)\n✅ Ունենք **մեծածախ** գներ\n✅ Պրոմոկոդներով լրացուցիչ զեղչեր\n\n📊 Ընդհանուր գումարը ավտոմատ հաշվարկվում է զամբյուղում։"
  },
  {
    keywords: ['փնտրել', 'search', 'որոնում', 'գտնել', 'կոդ'],
    answer: "🔍 **Որոնում**.\n\n1️⃣ Մտեք ցանկացած բաժին (Կոշիկներ/Հողաթափեր)\n2️⃣ Օգտվեք վերևի **որոնման դաշտից** 🔎\n3️⃣ Կարող եք փնտրել՝\n   • Ապրանքի անունով\n   • Կոդով\n\n⚡ Արդյունքները կցուցադրվեն անմիջապես։"
  },
  {
    keywords: ['բջջային', 'mobile', 'հեռախոս', 'նավիգացիա', 'մենյու'],
    answer: "📱 **Բջջային տարբերակ**.\n\n⬇️ Ներքևի նավիգացիոն տողում կան՝\n\n🏠 **ԳԼԽԱՎՈՐ** — Հիմնական էջ\n📂 **ԲԱԺԻՆՆԵՐ** — Տեսականի\n🛒 **ԶԱՄԲՅՈՒՂ** — Ձեր պատվերները\n👤 **ԱԴՄԻՆ** — Մուտք (միայն ադմինի համար)\n\nՕգտագործեք այս կոճակները՝ հեշտ նավիգացիայի համար։"
  },
  {
    keywords: ['առաքում', 'delivery', 'ուր', 'ժամանակ', 'երբ'],
    answer: "🚚 **Առաքման** մասին.\n\n✅ Առաքում ամբողջ **Հայաստանով**\n✅ Առաքման ժամկետները և ծախսերը կախված են տարածքից\n\n📞 Մանրամասների համար կապնվեք ադմինիստրատորի հետ **Viber/Telegram**-ով զամբյուղը կիսելուց հետո։"
  },
  {
    keywords: ['վճարում', 'payment', 'ինչպես վճարել', 'քարտ'],
    answer: "💳 **Վճարում**.\n\n🎯 Վճարման եղանակները կքննարկվեն պատվեր հաստատելուց հետո։\n\n📞 Պատվերը հաստատեք և կապնվեք ադմինիստրատորի հետ՝\n• **Viber**\n• **WhatsApp** \n• **Telegram**\n\nԱնհրաժեշտ տեղեկությունները կտրամադրվեն։"
  },
  {
    keywords: ['սխալ', 'error', 'չի աշխատում', 'խնդիր', 'bug'],
    answer: "⚠️ **Տեխնիկական խնդիր**.\n\n🔧 Եթե կայքում խնդիր եք հայտնաբերել՝\n\n1️⃣ Փորձեք թարմացնել էջը (F5)\n2️⃣ Մաքրեք browser-ի cache-ը\n3️⃣ Փորձեք այլ browser-ով\n\n📞 Եթե խնդիրը շարունակվում է՝ կապնվեք ադմինիստրատորի հետ։"
  }
];

// Ավելի խելացի LOCAL search функция
const getLocalFallbackResponse = (query: string, products: any[]) => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Առաջին՝ ստուգել FAQ-ում
  for (const item of FAQ_DATA) {
    if (item.keywords.some(key => lowerQuery.includes(key.toLowerCase()))) {
      return item.answer;
    }
  }

  // Երկրորդ՝ ստուգել ապրանքների անուններ և կոդեր
  const foundProducts = products.filter(p => 
    lowerQuery.includes(p.code.toLowerCase()) || 
    lowerQuery.includes(p.name.toLowerCase())
  ).slice(0, 3);

  if (foundProducts.length > 0) {
    let resp = "🔍 **Գտնված ապրանքներ**\n\n";
    foundProducts.forEach(p => {
      resp += `🔹 **${p.name}**\n💰 Գին՝ **${p.price.toLocaleString()} ֏**\n🔢 Կոդ՝ **${p.code}**\n${p.category === 'sneakers' ? '👟 Սպորտային կոշիկ' : '🥿 Հողաթափ'}\n\n`;
    });
    resp += "💡 Ապրանքները ավելացնելու համար մտեք համապատասխան բաժին և սեղմեք **«ՈՒՂՂԱՐԿԵԼ ԶԱՄԲՅՈՒՂ»**։";
    return resp;
  }

  // Եթե ոչինչ չգտավ
  return "🤔 Ներողություն, ես չկարողացա գտնել կոնկրետ պատասխան ձեր հարցին։\n\n💡 **Հնարավոր է...**\n• AI համակարգը ժամանակավորապես անհասանելի է\n• Լիմիտը սպառվել է\n\n📞 Խնդրում եմ փորձեք մի փոքր ուշ կամ կապնվեք ադմինիստրատորի հետ։";
};

export function AIAssistant({ products = [] }: { products?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: '👋 Ողջույն! Ես ձեր AI օգնականն եմ։ Ինչպե՞ս կարող եմ օգնել ձեզ այսօր։' 
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true); // API հասանելիության ստատուս
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const hasBeenWelcomed = localStorage.getItem('ai_assistant_welcomed');
    if (!hasBeenWelcomed) {
      const timer = setTimeout(() => {
        setShowBubble(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleToggle = () => {
    if (!isOpen && showBubble) {
      closeBubble();
    }
    setIsOpen(!isOpen);
  };

  const closeBubble = () => {
    setShowBubble(false);
    localStorage.setItem('ai_assistant_welcomed', 'true');
  };

  const handleSend = async (isRetry = false, retryMessage?: string) => {
    if (!userMessage.trim() && !isRetry) return;
    if (isLoading && !isRetry) return;

    const inputMessage = isRetry ? (retryMessage ?? '') : userMessage.trim();
    if (!inputMessage) return;
    
    if (!isRetry) {
      setIsLoading(true);
      setUserMessage('');
      setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
    }

    // ========== ՓՈՐՁ API-ի հետ աշխատել ==========
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      // Եթե API key չկա կամ API-ն նախկինում հասանելի չէր
      if (!apiKey || !apiAvailable) {
        throw new Error("API unavailable");
      }

      const ai = new GoogleGenAI({ apiKey });

      const productData = products.slice(0, 10).map(p => ({
        name: p.name,
        price: p.price,
        code: p.code,
        category: p.category
      }));

      const systemInstruction = `Դուք "EdgSport" խանութի պրոֆեսիոնալ AI օգնականն եք: 
Ձեր նպատակն է տալ ԿՈՆԿՐԵՏ և ՃՇԳՐԻՏ պատասխաններ կայքի օգտագործման վերաբերյալ:

ԿԱՅՔԻ ՆՊԱՏԱԿԸ:
Կայքը ստեղծված է նրա համար, որպեսզի ձեր կողմից արդեն իսկ հավանած տեսականիները լինեն պատրաստ նախօրոք:

ԿԱՐԵՎՈՐ ՏԵՂԵԿՈՒԹՅՈՒՆՆԵՐ ԿԱՅՔԻ ՄԱՍԻՆ:
1. **Նավիգացիա**: Գլխավոր էջում սեղմելով **"Դիտել տեսականին"** կոճակը, դուք կտեսնեք **"Սպորտային կոշիկներ"** և **"Հողաթափեր"** բաժինները: Սեղմելով դրանցից մեկի վրա՝ կբացվի համապատասխան տեսականին:
2. **Ապրանքի ընտրություն**: Ապրանքը ընտրելու համար պետք է սեղմել դրա վրա առկա **"Ուղղարկել զամբյուղ"** կոճակը:
3. **Զամբյուղի բաժին**: Գտնվում է կայքի ամենավերևի էջի **աջ անկյունում**: Այն սեղմելով կհայտնվեք զամբյուղ բաժնում, որտեղ կարող եք դիտել ընտրված ապրանքները, ավելացնել կամ պակասեցնել քանակները, կամ ջնջել ապրանքը:
4. **Կիսվել Զամբյուղով**: **Viber**, **WhatsApp** և **Telegram** կոճակները հայտնվում են զամբյուղում միայն այն դեպքում, երբ այնտեղ առկա է **առնվազն մեկ ապրանք**: Դրանք թույլ են տալիս ուղարկել ձեր զամբյուղի տեսականին (նկարներով և քանակներով) համապատասխան հասցեատիրոջը: Սխալի դեպքում փորձեք նորից կամ կապնվեք ադմինի հետ:
5. **Պատվերի հաստատում**: Պատվերը ձևակերպելու համար լրացրեք դաշտերը, սեղմեք **"ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ"** և զանգահարեք հասցեատիրոջը: Սխալ պատվերի դեպքում տեղյակ պահեք կայքի տիրոջը կամ ադմինին:
6. **Նկարների դիտում**: Նկարը ավելի մեծ դիտելու համար **սեղմած պահեք նկարի վրա**, և կհայտնվեն համապատասխան տարբերակներ այն մեծացնելու համար: Եթե նկարները լիարժեք չեն երևում, թարմացրեք էջը կամ սպասեք:
7. **Պրոմոկոդ**: Նախատեսված է զեղչի համար: Այն պետք է վերցնել կայքի **ադմինից**:
8. **Զամբյուղի պահպանում**: Ձեր ընտրված ապրանքները զամբյուղում երևում են այնքան ժամանակ, քանի դեռ չեք կատարել պատվեր կամ չեք կիսվել դրանցով սոց. հավելվածների միջոցով:
9. **Բջջային տարբերակ (Mobile)**: Կայքի ներքևի մասում կա նավիգացիոն տող (Bottom Nav) հետևյալ կոճակներով՝ **ԳԼԽԱՎՈՐ**, **ԲԱԺԻՆՆԵՐ**, **ԶԱＭԲՅՈՒՂ** և **ԱԴՄԻՆ**:

ԿԱՆՈՆՆԵՐ:
- Պատասխանեք ՄԻԱՅՆ կայքին և ապրանքներին վերաբերող հարցերին:
- Յուրաքանչյուր պատասխան պետք է լինի կոնկրետ: Օրինակ՝ "Սեղմեք ներքևի նավիգացիոն տողի կենտրոնում գտնվող ԶԱՄԲՅՈՒՂ կոճակը":
- Եթե հարցը վերաբերում է ապրանքին, նշեք դրա գինը և կոդը:
- Օգտագործեք Markdown: Կարևոր բառերը դարձրեք **bold**:

Ահա որոշ ապրանքներ կայքից:
${JSON.stringify(productData)}

Խոսեք միայն հայերենով: Եղեք շատ հստակ և մի տվեք ընդհանուր պատասխաններ:`;

      const contents: any[] = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      contents.push({ role: 'user', parts: [{ text: inputMessage }] });

      // AbortController — stream cancel
      abortRef.current = new AbortController();
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents,
        systemInstruction,
        config: { temperature: 0.7, topP: 0.9, topK: 40 }
      }, { signal: abortRef.current.signal });

      let fullText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        const text = chunk.text?.() ?? '';
        fullText += text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullText };
          return updated;
        });
      }

      // Եթե API-ն աշխատեց՝ նշանակել որ հասանելի է
      setApiAvailable(true);

    } catch (error: any) {
      // ========== ERROR HANDLING - ՍԽԱԼՆԵՐԻ ՄՇԱԿՈՒՄ ==========
      
      // Մաքրել նախորդ անկատար հաղորդագրությունը
      setMessages(prev => prev.filter(m => m.content !== ''));
      
      // ԿԱՐԵՎՈՐ: Console-ում սխալ ՉԻ ՑՈՒՑԱԴՐՎԵԼՈՒ
      // error-ը լոգավորվում է միայն development-ում, production-ում ոչ
      if (import.meta.env.DEV) {
        console.warn('AI Assistant: Falling back to local FAQ', error?.message);
      }
      
      // Նշանակել որ API-ն անհասանելի է
      setApiAvailable(false);
      
      // Օգտագործել LOCAL FAQ բազան
      const localResponse = getLocalFallbackResponse(inputMessage, products);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: localResponse
      }]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      <div className="relative">
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute -bottom-16 right-0 bg-white text-gray-900 px-3 py-2 rounded-2xl shadow-2xl border border-gray-200 max-w-[200px] z-[100]"
            >
              <button
                onClick={(e) => { e.stopPropagation(); closeBubble(); }}
                className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg z-[110]"
              >
                <X size={12} />
              </button>
              <p className="text-[11px] sm:text-xs font-bold leading-tight text-gray-800">
                Ողջույն! Ես ձեր AI օգնականն եմ։ Կարո՞ղ եմ օգնել ձեզ։
              </p>
              <div className="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggle();
          }}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors group cursor-pointer z-[70]"
          title="AI Օգնական"
          type="button"
        >
          <MessagesSquare size={20} className="text-white/80 group-hover:text-white transition-colors" />
          <Sparkles size={10} className="absolute top-1 right-1 text-yellow-400 animate-pulse" />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex flex-col sm:items-end sm:justify-start sm:p-4 sm:pt-20 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              />
              
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 50, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full h-full sm:w-[400px] sm:h-[calc(100vh-120px)] sm:max-h-[700px] bg-[#09090b] border-none sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              >
              <div className="p-4 bg-gradient-to-r from-[#3b82f6] to-[#f97316] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Օգնական</h3>
                    <p className="text-[10px] opacity-80">
                      {apiAvailable ? 'Միշտ պատրաստ օգնելու' : '💾 Offline ռեժիմ'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
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
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {isLoading && idx === messages.length - 1 && msg.role === 'assistant' && (
                            <span className="typing-cursor" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2 items-center bg-zinc-800 border border-white/10 p-3 rounded-2xl rounded-tl-none shadow-lg">
                        <Loader2 size={14} className="animate-spin text-[#f97316]" />
                        <span className="text-xs text-gray-300">Մտածում եմ...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

              <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Գրեք ձեր հարցը..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!userMessage.trim() || isLoading}
                    className="absolute right-1.5 p-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:hover:bg-[#3b82f6] text-white rounded-lg transition-all"
                  >
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .markdown-content img {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          border-radius: 12px;
          margin: 12px 0;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .markdown-content p {
          margin-bottom: 8px;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .typing-cursor::after {
          content: '▋';
          display: inline-block;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
          margin-left: 2px;
          color: #f97316;
        }
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
    </>
  );
}
