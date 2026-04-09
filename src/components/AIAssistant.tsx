import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessagesSquare, X, Send, Bot, User, Loader2, Sparkles, Camera } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { toJpeg } from 'html-to-image';

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export function AIAssistant({ products = [] }: { products?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Ողջույն! Ես ձեր AI օգնականն եմ: Ինչպե՞ս կարող եմ օգնել ձեզ այսօր:' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const hasBeenWelcomed = localStorage.getItem('ai_assistant_welcomed');
    if (!hasBeenWelcomed) {
      const timer = setTimeout(() => {
        setShowBubble(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
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

  const captureSiteImage = async () => {
    const element = document.getElementById('site-main-content');
    if (!element) return null;
    
    try {
      // Use toJpeg for better performance and smaller size
      // Reduced pixelRatio and quality for speed
      const dataUrl = await toJpeg(element, {
        backgroundColor: '#09090b',
        pixelRatio: 1,
        quality: 0.7,
        filter: (node) => {
          // Exclude the AI assistant container and any overlays
          if (node.classList?.contains('ai-assistant-container')) return false;
          if (node.classList?.contains('fixed') && node.classList?.contains('inset-0')) return false;
          return true;
        },
        height: window.innerHeight,
        width: window.innerWidth,
        style: {
          transform: `translateY(-${window.scrollY}px)`,
          transformOrigin: 'top left',
        }
      });

      return dataUrl;
    } catch (err) {
      console.error('Capture error:', err);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    // Set loading state IMMEDIATELY to provide visual feedback
    setIsLoading(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Capture screenshot in the background
    const siteScreenshot = await captureSiteImage();

    try {
      const model = "gemini-3-flash-preview";
      
      // Prepare product data for the AI to use specific images
      const productData = products.slice(0, 15).map(p => ({
        name: p.name,
        image: p.image,
        price: p.price,
        code: p.code,
        category: p.category
      }));

      const systemInstruction = `Դուք "EdgSport" խանութի պրոֆեսիոնալ AI օգնականն եք: 
Ձեր նպատակն է տալ ԿՈՆԿՐԵՏ և ՃՇԳՐԻՏ պատասխաններ կայքի օգտագործման վերաբերյալ:

ԿԱՐԵՎՈՐ ԿԱՆՈՆՆԵՐ:
1. Պատասխանեք ՄԻԱՅՆ կայքին և ապրանքներին վերաբերող հարցերին:
2. Ձեզ տրամադրված է կայքի ընթացիկ screenshot-ը: Օգտագործեք այն՝ օգտատիրոջը ցույց տալու համար, թե ՈՐՏԵՂ է գտնվում անհրաժեշտ կոճակը կամ բաժինը:
3. Յուրաքանչյուր պատասխան պետք է լինի կոնկրետ: Օրինակ՝ "Սեղմեք վերևի աջ անկյունում գտնվող նարնջագույն զամբյուղի կոճակը":
4. Եթե հարցը վերաբերում է ապրանքին, նշեք դրա գինը և կոդը:
5. Օգտագործեք Markdown: Կարևոր բառերը դարձրեք **bold**:

Տեսողական ուղեցույց.
- Օգտագործեք սլաքներ (⬇️, ➡️, ⬅️, ⬆️)՝ ուղղությունները ցույց տալու համար:
- Նկարագրեք տարրերի գույները (օրինակ՝ "Կապույտ կոճակ", "Սպիտակ մենյու"):

Կայքի հիմնական տարրերը.
- **Գլխավոր Մենյու**: Գտնվում է վերևում: Այնտեղ կան "Ապրանքներ", "Բաժիններ" և "Զամբյուղ":
- **Զամբյուղ**: Վերևի աջ մասում (Desktop) կամ ներքևի նավիգացիոն տողում (Mobile):
- **Ապրանքի քարտ**: Ունի "Ավելացնել" կոճակ, որը ապրանքը ուղարկում է զամբյուղ:

Ահա որոշ ապրանքներ կայքից.
${JSON.stringify(productData)}

Խոսեք միայն հայերենով: Եղեք շատ հստակ և մի տվեք ընդհանուր պատասխաններ:`;

      const contents: any[] = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const userParts: any[] = [{ text: userMessage }];
      if (siteScreenshot) {
        userParts.push({
          inlineData: {
            mimeType: "image/png",
            data: siteScreenshot.split(',')[1]
          }
        });
      }

      contents.push({ role: 'user', parts: userParts });

      const response = await genAI.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const aiResponse = response.text || "Ցավոք, չկարողացա պատասխանել ձեր հարցին: Խնդրում եմ փորձեք նորից:";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse, image: siteScreenshot || undefined }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Կներեք, տեխնիկական խնդիր առաջացավ: Խնդրում եմ փորձեք մի փոքր ուշ:" }]);
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
              <button 
                onClick={(e) => { e.stopPropagation(); closeBubble(); }}
                className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg z-[110]"
              >
                <X size={12} />
              </button>
              <p className="text-[11px] sm:text-xs font-bold leading-tight text-gray-800">
                Ողջույն! Ես ձեր AI օգնականն եմ: Կարո՞ղ եմ օգնել ձեզ:
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
              {/* Backdrop */}
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
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#3b82f6] to-[#f97316] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Օգնական</h3>
                    <p className="text-[10px] opacity-80">Միշտ պատրաստ օգնելու</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`mt-1 p-1 rounded-full flex-shrink-0 h-fit ${msg.role === 'user' ? 'bg-[#3b82f6]' : 'bg-[#f97316]'}`}>
                        {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm markdown-content ${
                        msg.role === 'user' 
                          ? 'bg-[#3b82f6] text-white rounded-tr-none' 
                          : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                      }`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {msg.image && msg.role === 'assistant' && (
                          <div className="mt-3 border border-white/10 rounded-lg overflow-hidden bg-black/40">
                            <div className="bg-white/5 px-2 py-1 text-[10px] text-white/40 flex items-center gap-1">
                              <Camera size={10} /> Կայքի ընթացիկ տեսքը
                            </div>
                            <img src={msg.image} alt="Site state" className="w-full h-auto" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 items-center bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 size={14} className="animate-spin text-[#f97316]" />
                      <span className="text-xs text-gray-400">Մտածում եմ...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Գրեք ձեր հարցը..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
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
      `}} />
    </>
  );
}
