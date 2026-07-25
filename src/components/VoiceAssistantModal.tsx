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
  onMarkProductUsedByName: (name: string) => boolean;
  onUpdateProductByName: (name: string, updates: Partial<Product>) => boolean;
  onUpdateShoppingItemByName: (name: string, updates: Partial<ShoppingItem>) => boolean;
  onDeleteShoppingItemByName: (name: string) => boolean;
  onClearShoppingList: () => void;
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
  onMarkProductUsedByName,
  onUpdateProductByName,
  onUpdateShoppingItemByName,
  onDeleteShoppingItemByName,
  onClearShoppingList,
  onNavigateTab,
  onGenerateRecipeWithIngredients,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm0',
      sender: 'assistant',
      text: "Namaste! I'm your Smart Pantry AI Voice Assistant. How can I help you manage your kitchen today? Try saying 'Add milk expiring on July 30' or 'Open shopping list'.",
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

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Indian English localization

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserQuery(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech function
  const speakText = (text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; // Indian voice accent
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser speech recognition is not supported in this browser. Please type your query!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const inferCategory = (name: string): ProductCategory => {
    const n = name.toLowerCase();
    if (n.includes('milk') || n.includes('paneer') || n.includes('cheese') || n.includes('butter') || n.includes('curd') || n.includes('yogurt') || n.includes('ghee')) return 'Dairy';
    if (n.includes('crocin') || n.includes('paracetamol') || n.includes('cough') || n.includes('pill') || n.includes('tablet') || n.includes('capsule') || n.includes('syrup')) return 'Medicine';
    if (n.includes('tomato') || n.includes('onion') || n.includes('potato') || n.includes('garlic') || n.includes('ginger') || n.includes('spinach') || n.includes('chili')) return 'Vegetables';
    if (n.includes('apple') || n.includes('banana') || n.includes('mango') || n.includes('grape') || n.includes('orange') || n.includes('berry')) return 'Fruits';
    if (n.includes('bread') || n.includes('bun') || n.includes('toast') || n.includes('roti') || n.includes('naan')) return 'Bakery';
    if (n.includes('biscuit') || n.includes('cookie') || n.includes('chip') || n.includes('kurkure') || n.includes('maggi') || n.includes('noodle')) return 'Snacks';
    if (n.includes('coke') || n.includes('pepsi') || n.includes('juice') || n.includes('water') || n.includes('tea') || n.includes('coffee')) return 'Beverages';
    return 'Other';
  };

  const parseNaturalDate = (text: string): string | null => {
    const clean = text.toLowerCase();
    const today = new Date();
    
    // Check for DD/MM/YYYY or DD-MM-YYYY
    const digitalMatch = clean.match(/(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{4}))?/);
    if (digitalMatch) {
      const day = parseInt(digitalMatch[1]);
      const month = parseInt(digitalMatch[2]) - 1;
      const year = digitalMatch[4] ? parseInt(digitalMatch[4]) : today.getFullYear();
      const dObj = new Date(year, month, day);
      if (!isNaN(dObj.getTime())) {
        return dObj.toISOString().split('T')[0];
      }
    }
    
    if (clean.includes('today')) {
      return today.toISOString().split('T')[0];
    }
    if (clean.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (clean.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    // Check month name matches
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let monthIndex = -1;
    for (let i = 0; i < months.length; i++) {
      if (clean.includes(months[i])) {
        monthIndex = i % 12;
        break;
      }
    }

    if (monthIndex !== -1) {
      const numbers = clean.match(/\d+/g) || [];
      let day = 1;
      let year = today.getFullYear();
      for (const numStr of numbers) {
        if (numStr.length === 4) {
          year = parseInt(numStr);
        } else if (numStr.length === 1 || numStr.length === 2) {
          day = parseInt(numStr);
        }
      }
      const dObj = new Date(year, monthIndex, day);
      if (!isNaN(dObj.getTime())) {
        return dObj.toISOString().split('T')[0];
      }
    }

    return null;
  };

  const parseQuantity = (text: string): { qty: number; unit: string } => {
    const clean = text.toLowerCase();
    const numberWords: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    let qty = 1;
    let unit = 'pcs';

    // Try finding digit matches
    const digitMatch = clean.match(/\b\d+\b/);
    if (digitMatch) {
      qty = parseInt(digitMatch[0]);
    } else {
      // Try word matches
      for (const word in numberWords) {
        if (clean.includes(word)) {
          qty = numberWords[word];
          break;
        }
      }
    }

    // Try finding unit matches
    const units = ['packet', 'pack', 'kg', 'gram', 'litre', 'liter', 'ml', 'pcs', 'bottle', 'strip'];
    for (const u of units) {
      if (clean.includes(u)) {
        unit = u;
        if (qty > 1 && !u.endsWith('s') && u === 'packet') {
          unit = 'packets';
        }
        break;
      }
    }

    return { qty, unit };
  };

  // Core Natural Language Parser & Action Executor
  const handleUserQuery = async (query: string) => {
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

    try {
      const response = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: context,
          inventory: products.map(p => ({
            name: p.name,
            category: p.category,
            expiryDate: p.expiryDate,
            location: p.location
          }))
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      const intent = data.intent;
      const extracted = data.extractedData || {};
      const missing = data.missingFields || [];
      let finalReplyText = data.reply;
      const navTab = data.navigationTab;

      let actionText = '';

      if (intent === 'add_product') {
        if (missing.length > 0) {
          setContext({
            pendingAction: 'add_product',
            ...extracted
          });
        } else {
          onAddProduct({
            name: extracted.productName,
            expiryDate: extracted.expiryDate,
            quantity: extracted.quantity || 1,
            unit: extracted.unit || 'pcs',
            category: extracted.category || inferCategory(extracted.productName),
            location: extracted.location || 'Kitchen',
            brand: extracted.brand || undefined,
            notes: extracted.notes || undefined,
            source: 'Manual'
          });
          setContext({});
          actionText = `Added ${extracted.productName} to pantry`;
          finalReplyText = `Product is added. Product added successfully. ${finalReplyText}`;
        }
      } else if (intent === 'add_shopping') {
        if (missing.length > 0) {
          setContext({
            pendingAction: 'add_shopping',
            ...extracted
          });
        } else {
          onAddShoppingItem({
            name: extracted.productName,
            category: extracted.category || inferCategory(extracted.productName),
            quantity: extracted.quantity || 1,
            unit: extracted.unit || 'pcs',
            priority: 'Medium',
            notes: extracted.notes || undefined,
            reason: 'Voice Command'
          });
          setContext({});
          actionText = `Added ${extracted.productName} to shopping list`;
        }
      } else if (intent === 'delete_product') {
        if (query.toLowerCase().includes('used') || query.toLowerCase().includes('finished') || query.toLowerCase().includes('done')) {
          const success = onMarkProductUsedByName(extracted.productName || query);
          actionText = success ? `Marked ${extracted.productName} as used` : 'Mark used failed';
        } else {
          const success = onDeleteProductByName(extracted.productName || query);
          actionText = success ? `Deleted ${extracted.productName}` : 'Delete failed';
        }
        setContext({});
      } else if (intent === 'edit_product') {
        const updates: Partial<Product> = {};
        if (extracted.expiryDate) updates.expiryDate = extracted.expiryDate;
        if (extracted.quantity) updates.quantity = extracted.quantity;
        const success = onUpdateProductByName(extracted.productName || query, updates);
        actionText = success ? `Updated ${extracted.productName}` : 'Update failed';
        setContext({});
      } else if (intent === 'shopping_list_ops') {
        if (query.toLowerCase().includes('clear') || query.toLowerCase().includes('reset')) {
          onClearShoppingList();
          actionText = 'Cleared shopping list';
        } else if (query.toLowerCase().includes('remove') || query.toLowerCase().includes('delete')) {
          const success = onDeleteShoppingItemByName(extracted.productName || query);
          actionText = success ? `Removed ${extracted.productName} from shopping` : 'Remove failed';
        } else if (query.toLowerCase().includes('purchase') || query.toLowerCase().includes('bought')) {
          const success = onUpdateShoppingItemByName(extracted.productName || query, { isPurchased: true } as any);
          actionText = success ? `Marked ${extracted.productName} purchased` : 'Update failed';
        }
        setContext({});
      } else if (intent === 'navigate' && navTab) {
        onNavigateTab(navTab);
        setContext({});
        actionText = `Navigated to ${navTab}`;
      } else if (intent === 'generate_recipe') {
        const expiring = products.filter(p => !p.isUsed).map(p => p.name);
        onGenerateRecipeWithIngredients(expiring.slice(0, 4));
        onNavigateTab('recipes');
        actionText = 'Generating recipes';
        setContext({});
      } else {
        setContext({});
      }

      finishAssistantResponse(finalReplyText, actionText || undefined);

    } catch (err) {
      console.warn('AI Voice assistant API failed, falling back to local NLU parser:', err);
      
      const lower = query.toLowerCase();
      let replyText = '';
      let actionTaken = '';

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

        onAddProduct({
          name: updatedName,
          expiryDate: updatedDate,
          quantity: updatedQty,
          unit: qtyFound.unit || 'pcs',
          category: category,
          location: category === 'Dairy' || category === 'Fruits' || category === 'Vegetables' ? 'Refrigerator' : category === 'Medicine' ? 'Medicine Box' : 'Pantry',
          source: 'Manual',
        });

        replyText = `Product is added. Product added successfully. ${updatedName} (${updatedQty} ${qtyFound.unit}) expiring on ${updatedDate} has been added successfully to your pantry.`;
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

      // 3. Mark Used / Delete Command
      if (lower.includes('used') || lower.includes('finished') || lower.includes('done')) {
        const targetName = lower.replace(/mark|as used|used|finished|done|the/g, '').trim();
        if (targetName) {
          const success = onMarkProductUsedByName(targetName);
          replyText = success
            ? `Marked ${targetName} as finished in your pantry.`
            : `Could not find an active product matching "${targetName}" in your pantry.`;
          finishAssistantResponse(replyText, success ? `Marked ${targetName} used` : undefined);
          return;
        }
      }

      if (lower.startsWith('delete') || lower.startsWith('remove')) {
        if (lower.includes('shopping')) {
          const targetName = lower.replace(/delete|remove|from shopping list|from shopping|list/g, '').trim();
          const success = onDeleteShoppingItemByName(targetName);
          replyText = success
            ? `Successfully removed ${targetName} from your shopping list.`
            : `Could not find "${targetName}" on your shopping list.`;
          finishAssistantResponse(replyText, success ? `Removed ${targetName}` : undefined);
          return;
        } else {
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
      }

      // 4. Cooking / Recipe Query
      if (lower.includes('cook') || lower.includes('recipe') || lower.includes('breakfast') || lower.includes('dinner')) {
        const matched = products.filter(p => !p.isUsed).map(p => p.name);
        onGenerateRecipeWithIngredients(matched.slice(0, 4));
        onNavigateTab('recipes');
        replyText = `Generating custom AI recipes based on your available pantry items (${matched.slice(0, 3).join(', ')}).`;
        finishAssistantResponse(replyText, "Generated AI Recipes");
        return;
      }

      // 5. Add Command Parsing
      if (lower.startsWith('add') || lower.includes('bought') || lower.includes('bought a') || lower.includes('add to shopping')) {
        const isShoppingList = lower.includes('shopping list') || lower.includes('shopping');
        const cleanStr = lower.replace(/add|bought|to my pantry|to pantry|to shopping list|to shopping/g, '').trim();
        const dateParsed = parseNaturalDate(query);
        const qtyParsed = parseQuantity(query);

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

        if (!dateParsed) {
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

        onAddProduct({
          name: nameCandidate,
          expiryDate: dateParsed,
          quantity: qtyParsed.qty,
          unit: qtyParsed.unit,
          category: category,
          location: category === 'Dairy' || category === 'Fruits' || category === 'Vegetables' ? 'Refrigerator' : category === 'Medicine' ? 'Medicine Box' : 'Pantry',
          source: 'Manual',
        });

        replyText = `Product is added. Product added successfully. "${nameCandidate}" (${qtyParsed.qty} ${qtyParsed.unit}) expiring on ${dateParsed} has been added to your pantry.`;
        finishAssistantResponse(replyText, `Added ${nameCandidate} to Pantry`);
        return;
      }

      // Default General Response
      replyText = `I analyzed your pantry: You have ${products.length} products stored. Would you like me to add a product, check expiring items, open your shopping list, or suggest recipes?`;
      finishAssistantResponse(replyText);
    }
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
                Smart Pantry Voice AI
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Live Voice
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Pantry Product Entry & Smart Shopping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted 
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-500' 
                  : 'bg-white dark:bg-slate-800 border-[#E2E4E9] dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title={isMuted ? "Unmute Voice Response" : "Mute Voice Response"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-[#E2E4E9] dark:border-slate-800 flex gap-2 overflow-x-auto select-none no-scrollbar">
          {[
            "Add 2 Amul milk packets expiring on July 30",
            "Update Bread quantity to 3",
            "Mark Eggs as Used",
            "What can I cook today?",
            "Open Shopping List"
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuery(chip)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shrink-0 hover:border-teal-600 transition-colors text-xs"
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
