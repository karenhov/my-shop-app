import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessagesSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    if (!userMessage.trim() || isLoading) return;

    const inputMessage = userMessage.trim();
    
    // 1. Update UI immediately
    setIsLoading(true);
    setUserMessage('');
    setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);

    try {
      // Use gemini-3-flash-preview as recommended by the SDK guidelines
      const modelName = "gemini-3-flash-preview";
      
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please check your environment variables.");
      }

      const productData = products.slice(0, 15).map(p => ({
        name: p.name,
        image: p.image,
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
9. **Բջջային տարբերակ (Mobile)**: Կայքի ներքևի մասում կա նավիգացիոն տող (Bottom Nav) հետևյալ կոճակներով՝ **ԳԼԽԱՎՈՐ**, **ԲԱԺԻՆՆԵՐ**, **ԶԱՄԲՅՈՒՂ** և **ԱԴՄԻՆ**:

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

      // Add a placeholder message for the assistant that we will stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const result = await genAI.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      let fullResponse = "";
      for await (const chunk of result) {
        const chunkText = chunk.text;
        
        // Process each chunk with a slight delay to simulate typing
        for (let i = 0; i < chunkText.length; i++) {
          fullResponse += chunkText[i];
          
          // Update the last message in the list
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = fullResponse;
            }
            return newMessages;
          });
          
          // Small delay between characters for a more natural feel
          // 15ms is a good balance between "too fast" and "too slow"
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      }

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

              {/* Input */}
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
