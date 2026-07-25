import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ArrowRight, 
  RotateCcw,
  ShoppingBag,
  Utensils,
  LayoutDashboard,
  Clock,
  Pill,
  CheckCircle2
} from 'lucide-react';
import { Product, ProductCategory, ShoppingItem } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (prodPartial: Partial<Product>) => void;
  onAddShoppingItem: (itemPartial: Omit<ShoppingItem, 'id' | 'createdAt' | 'isPurchased'>) => void;
  onDeleteProductByName: (name: string) => boolean;
  onNavigateTab: (tab: 'dashboard' | 'products' | 'scan' | 'manual' | 'shopping' | 'recipes' | 'chat' | 'analytics' | 'settings') => void;
  onGenerateRecipeWithIngredients: (ingredients: string[]) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionText?: string;
  timestamp: string;
}

interface ConversationContext {
  pendingAction?: 'add_product' | 'add_shopping';
  productName?: string;
  expiryDate?: string;
  quantity?: number;
  category?: ProductCategory;
  unit?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onAddShoppingItem,
  onDeleteProductByName,
  onNavigateTab,
  onGenerateRecipeWithIngredients,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm0',
      sender: 'assistant',
      text: "Hello! I'm your Smart Pantry & Voice Assistant. How can I help you today? You can speak or type commands like 'Add milk expiring on July 30' or 'What can I cook today?'",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [context, setContext] = useState<ConversationContext>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleUserQuery(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  // Text-To-Speech Output
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Auto category inference
  const inferCategory = (name: string): ProductCategory => {
    const lower = name.toLowerCase();
    if (lower.includes('milk') || lower.includes('yogurt') || lower.includes('cheese') || lower.includes('butter') || lower.includes('cream')) return 'Dairy';
    if (lower.includes('paracetamol') || lower.includes('aspirin') || lower.includes('syrup') || lower.includes('pill') || lower.includes('medicine') || lower.includes('tablet')) return 'Medicine';
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('strawberry') || lower.includes('orange') || lower.includes('grape') || lower.includes('berry')) return 'Fruits';
    if (lower.includes('spinach') || lower.includes('tomato') || lower.includes('potato') || lower.includes('onion') || lower.includes('carrot') || lower.includes('vegetable')) return 'Vegetables';
    if (lower.includes('bread') || lower.includes('bun') || lower.includes('croissant') || lower.includes('pastry') || lower.includes('cake')) return 'Bakery';
    if (lower.includes('chip') || lower.includes('biscuit') || lower.includes('cookie') || lower.includes('snack') || lower.includes('nut')) return 'Snacks';
    if (lower.includes('soda') || lower.includes('juice') || lower.includes('drink') || lower.includes('coke') || lower.includes('water')) return 'Beverages';
    if (lower.includes('frozen') || lower.includes('peas') || lower.includes('ice cream')) return 'Frozen Food';
    return 'Other';
  };

  // Date Parser Helper for natural phrases
  const parseNaturalDate = (text: string): string | null => {
    const lower = text.toLowerCase();
    const today = new Date();

    if (lower.includes('today')) {
      return today.toISOString().split('T')[0];
    }
    if (lower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (lower.includes('yesterday')) {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      return yest.toISOString().split('T')[0];
    }
    if (lower.includes('next week') || lower.includes('in a week')) {
      const nextWk = new Date(today);
      nextWk.setDate(today.getDate() + 7);
      return nextWk.toISOString().split('T')[0];
    }

    // Try parsing "July 30", "December 10", "10/12/2026", "2026-08-15"
    const months: { [key: string]: number } = {
      january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
      may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8,
      october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11
    };

    for (const [mName, mIdx] of Object.entries(months)) {
      if (lower.includes(mName)) {
        const dayMatch = lower.match(new RegExp(`${mName}\\s+(\\d{1,2})`)) || lower.match(new RegExp(`(\\d{1,2})\\s+${mName}`));
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          const year = today.getFullYear();
          const target = new Date(year, mIdx, day);
          if (target < today) target.setFullYear(year + 1);
          return target.toISOString().split('T')[0];
        }
      }
    }

    // YYYY-MM-DD match
    const dateMatch = lower.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) return dateMatch[0];

    return null;
  };

  // Quantity Parser Helper
  const parseQuantity = (text: string): { qty: number; unit: string } => {
    const lower = text.toLowerCase();
    const wordNums: { [key: string]: number } = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      a: 1, an: 1, pair: 2, dozen: 12
    };

    for (const [word, val] of Object.entries(wordNums)) {
      if (new RegExp(`\\b${word}\\b`).test(lower)) {
        let unit = 'pcs';
        if (lower.includes('packet') || lower.includes('pack')) unit = 'pack';
        if (lower.includes('liter') || lower.includes('litre') || lower.includes('l')) unit = 'L';
        if (lower.includes('kg') || lower.includes('kilo')) unit = 'kg';
        if (lower.includes('bottle')) unit = 'bottle';
        return { qty: val, unit };
      }
    }

    const numMatch = lower.match(/(\d+)\s*(packets?|packs?|kg|liters?|litres?|bottles?|pcs)?/);
    if (numMatch) {
      const qty = parseInt(numMatch[1]);
      let unit = numMatch[2] || 'pcs';
      if (unit.startsWith('pack')) unit = 'pack';
      if (unit.startsWith('liter') || unit.startsWith('litre')) unit = 'L';
      return { qty, unit };
    }

    return { qty: 1, unit: 'pcs' };
  };

  // Core Natural Language Parser & Action Executor
  const handleUserQuery = (query: string) => {
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyText = '';
      let actionTaken = '';

      // Check if we are in a pending multi-turn conversation
      if (context.pendingAction === 'add_product') {
        const dateFound = parseNaturalDate(query);
        const qtyFound = parseQuantity(query);

        const updatedName = context.productName || 'Item';
        const updatedDate = dateFound || context.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const updatedQty = qtyFound.qty || context.quantity || 1;
        const category = context.category || inferCategory(updatedName);

        if (!dateFound && !context.expiryDate && !query.includes('default') && !query.includes('no date')) {
          replyText = `Got it! What is the expiry date for ${updatedName}? (e.g. July 30, tomorrow, or in 1 week)`;
          setContext({ ...context, quantity: updatedQty });
          finishAssistantResponse(replyText);
          return;
        }

        // Add Product!
        onAddProduct({
          name: updatedName,
          expiryDate: updatedDate,
          quantity: updatedQty,
          unit: qtyFound.unit || 'pcs',
          category: category,
          location: category === 'Dairy' || category === 'Fruits' || category === 'Vegetables' ? 'Refrigerator' : category === 'Medicine' ? 'Medicine Box' : 'Pantry',
          source: 'Manual',
        });

        replyText = `Done! ${updatedName} (${updatedQty} ${qtyFound.unit}) expiring on ${updatedDate} has been added successfully to your pantry.`;
        actionTaken = `Added ${updatedName} to Pantry`;
        setContext({});
        finishAssistantResponse(replyText, actionTaken);
        return;
      }

      // 1. Navigation Commands
      if (lower.includes('open shopping list') || lower.includes('show shopping list') || lower.includes('go to shopping')) {
        onNavigateTab('shopping');
        replyText = "Opening your Smart Shopping List now.";
        finishAssistantResponse(replyText, "Navigated to Shopping List");
        return;
      }
      if (lower.includes('open dashboard') || lower.includes('show dashboard') || lower.includes('go to dashboard')) {
        onNavigateTab('dashboard');
        replyText = "Opening your Dashboard overview.";
        finishAssistantResponse(replyText, "Navigated to Dashboard");
        return;
      }
      if (lower.includes('open recipe') || lower.includes('show recipe') || lower.includes('ai chef')) {
        onNavigateTab('recipes');
        replyText = "Opening AI Recipe Chef for zero-waste meal suggestions.";
        finishAssistantResponse(replyText, "Navigated to AI Recipes");
        return;
      }

      // 2. Query Expiring Products / Medicines
      if (lower.includes('expire') || lower.includes('expiring')) {
        if (lower.includes('medicine') || lower.includes('pills') || lower.includes('tablet')) {
          const meds = products.filter(p => p.category === 'Medicine');
          replyText = meds.length > 0
            ? `You have ${meds.length} medicine item(s) in your box: ${meds.map(m => `${m.name} (Expires ${m.expiryDate})`).join(', ')}.`
            : "You currently have no medicine items recorded in your pantry.";
          finishAssistantResponse(replyText);
          return;
        }

        if (lower.includes('today') || lower.includes('tomorrow') || lower.includes('this week') || lower.includes('soon')) {
          const todayStr = new Date().toISOString().split('T')[0];
          const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
          const expiring = products.filter(p => p.expiryDate <= nextWeek && !p.isUsed);

          replyText = expiring.length > 0
            ? `You have ${expiring.length} product(s) expiring within a week: ${expiring.map(p => `${p.name} (Expires ${p.expiryDate})`).join(', ')}.`
            : "Great news! You have no products expiring in the next 7 days.";
          finishAssistantResponse(replyText);
          return;
        }
      }

      // 3. Query Fridge or Specific Category
      if (lower.includes('fridge') || lower.includes('refrigerator')) {
        const fridgeItems = products.filter(p => p.location === 'Refrigerator' && !p.isUsed);
        replyText = fridgeItems.length > 0
          ? `In your refrigerator, you have ${fridgeItems.length} item(s): ${fridgeItems.map(p => p.name).join(', ')}.`
          : "Your refrigerator is currently empty.";
        finishAssistantResponse(replyText);
        return;
      }

      // 4. Delete Command
      if (lower.startsWith('delete') || lower.startsWith('remove')) {
        const targetName = lower.replace(/delete|remove|the|product/g, '').trim();
        if (targetName) {
          const success = onDeleteProductByName(targetName);
          replyText = success
            ? `Successfully removed ${targetName} from your pantry.`
            : `Could not find an active product matching "${targetName}" in your pantry.`;
          finishAssistantResponse(replyText, success ? `Deleted ${targetName}` : undefined);
          return;
        }
      }

      // 5. Cooking / Recipe Generation Query
      if (lower.includes('cook') || lower.includes('recipe') || lower.includes('breakfast') || lower.includes('dinner')) {
        const matched = products.filter(p => !p.isUsed).map(p => p.name);
        onGenerateRecipeWithIngredients(matched.slice(0, 4));
        onNavigateTab('recipes');
        replyText = `Generating custom AI recipes based on your available pantry items (${matched.slice(0, 3).join(', ')}).`;
        finishAssistantResponse(replyText, "Generated AI Recipes");
        return;
      }

      // 6. Add Command Parsing (Multi-turn or Single Shot)
      if (lower.startsWith('add') || lower.includes('bought') || lower.includes('bought a') || lower.includes('add to shopping')) {
        // Check if adding to Shopping List vs Pantry
        const isShoppingList = lower.includes('shopping list') || lower.includes('shopping');

        const cleanStr = lower.replace(/add|bought|to my pantry|to pantry|to shopping list|to shopping/g, '').trim();
        const dateParsed = parseNaturalDate(query);
        const qtyParsed = parseQuantity(query);

        // Extract product name by removing dates/numbers
        let nameCandidate = cleanStr
          ? cleanStr.replace(/expiring.*|expires.*|yesterday|tomorrow|today|\d+|\b(one|two|three|four|five|six|seven|eight|nine|ten|packets|pack|pcs|kg|liter)\b/gi, '').trim()
          : '';

        if (!nameCandidate || nameCandidate.length < 2) {
          nameCandidate = 'Item';
        }

        const category = inferCategory(nameCandidate);

        if (isShoppingList) {
          onAddShoppingItem({
            name: nameCandidate,
            category: category,
            quantity: qtyParsed.qty,
            unit: qtyParsed.unit,
            priority: 'Medium',
            notes: 'Added via Voice Assistant',
            reason: 'Voice Command',
          });
          replyText = `Added "${nameCandidate}" (${qtyParsed.qty} ${qtyParsed.unit}) to your Smart Shopping List!`;
          finishAssistantResponse(replyText, "Added to Shopping List");
          return;
        }

        // Add to Pantry
        if (!dateParsed) {
          // Ask for missing expiry date (multi-turn memory)
          setContext({
            pendingAction: 'add_product',
            productName: nameCandidate,
            quantity: qtyParsed.qty,
            unit: qtyParsed.unit,
            category: category,
          });
          replyText = `I noticed you want to add "${nameCandidate}". What is its expiry date? (e.g. July 30, or tomorrow)`;
          finishAssistantResponse(replyText);
          return;
        }

        // Complete add
        onAddProduct({
          name: nameCandidate,
          expiryDate: dateParsed,
          quantity: qtyParsed.qty,
          unit: qtyParsed.unit,
          category: category,
          location: category === 'Dairy' || category === 'Fruits' || category === 'Vegetables' ? 'Refrigerator' : category === 'Medicine' ? 'Medicine Box' : 'Pantry',
          source: 'Manual',
        });

        replyText = `Done! "${nameCandidate}" (${qtyParsed.qty} ${qtyParsed.unit}) expiring on ${dateParsed} has been added to your pantry.`;
        finishAssistantResponse(replyText, `Added ${nameCandidate} to Pantry`);
        return;
      }

      // Default General Pantry Assistant Response
      replyText = `I analyzed your pantry: You have ${products.length} products stored. Would you like me to add a product, check expiring items, open your shopping list, or suggest recipes?`;
      finishAssistantResponse(replyText);

    }, 600);
  };

  const finishAssistantResponse = (text: string, actionText?: string) => {
    setIsThinking(false);
    const aiMsg: Message = {
      id: `ai_${Date.now()}`,
      sender: 'assistant',
      text,
      actionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, aiMsg]);
    speakText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-xl h-[90vh] sm:h-[650px] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border border-[#E2E4E9] dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E4E9] dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-600/20">
              <Sparkles className="w-5 h-5" />
              {isListening && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1C1E] dark:text-white flex items-center gap-2">
                AI Voice Assistant
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Live Voice
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Hands-free pantry & shopping management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl transition-colors ${
                isMuted ? 'text-red-500 bg-red-50 dark:bg-red-950/40' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-b border-[#E2E4E9] dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-bold shrink-0">Try:</span>
          {[
            'Add milk expiring July 30',
            'Open Shopping List',
            'What expires this week?',
            'What can I cook today?',
            'What medicines expire?',
            'Delete eggs'
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuery(chip)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shrink-0 hover:border-teal-600 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[80%] space-y-1`}>
                <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-[#1A1C1E] dark:text-slate-100 rounded-bl-none border border-[#E2E4E9] dark:border-slate-700/60'
                }`}>
                  {msg.text}
                </div>

                {msg.actionText && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{msg.actionText}</span>
                  </div>
                )}

                <div className={`text-[10px] text-slate-400 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-3 text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Animated Wave Indicator when listening */}
        {isListening && (
          <div className="py-2 px-4 bg-teal-50 dark:bg-teal-950/60 border-t border-teal-100 text-teal-800 dark:text-teal-200 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-500 animate-pulse" />
              Listening to your voice... Speak now!
            </span>
            <div className="flex items-center gap-1 h-4">
              <span className="w-1 h-3 bg-teal-600 rounded-full animate-pulse"></span>
              <span className="w-1 h-5 bg-teal-600 rounded-full animate-pulse [animation-delay:0.1s]"></span>
              <span className="w-1 h-2 bg-teal-600 rounded-full animate-pulse [animation-delay:0.2s]"></span>
              <span className="w-1 h-4 bg-teal-600 rounded-full animate-pulse [animation-delay:0.3s]"></span>
            </div>
          </div>
        )}

        {/* Bottom Input Controls */}
        <div className="p-4 border-t border-[#E2E4E9] dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserQuery(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' 
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice recognition'}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Or type voice command e.g. 'Add milk expiring on July 30'..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-2xl focus:outline-none focus:border-teal-600"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-3 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
