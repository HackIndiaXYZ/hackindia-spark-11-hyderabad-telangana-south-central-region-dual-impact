import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  Lightbulb, 
  Trash2,
  ChefHat
} from 'lucide-react';
import { ChatMessage, Product } from '../types';

interface AiChatViewProps {
  products: Product[];
}

export const AiChatView: React.FC<AiChatViewProps> = ({ products }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello! I'm Chef Gemini 👨‍🍳 Your AI culinary assistant. Ask me anything about cooking with your ingredients, recipe ideas, or food preservation tips!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "What can I cook using eggs and bread?",
    "I have milk and strawberries expiring soon.",
    "Give me a 15-minute healthy dinner recipe.",
    "How do I keep fresh herbs lasting longer?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/recipe-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          inventory: products.map(p => ({ name: p.name, expiryDate: p.expiryDate })),
        }),
      });

      let errorMessage = "Unable to contact Gemini AI.";
      if (!response.ok) {
        try {
          const errData = await response.json();
          if (errData.error) errorMessage = errData.error;
        } catch (_) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.response || "I couldn't process that. Please try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: err.message || "Unable to contact Gemini AI.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    if (!isListening) {
      setIsListening(true);
      recognition.lang = 'en-US';
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 flex flex-col h-[82vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              Chef Gemini AI Chat
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-500">Ask cooking questions or request custom recipes</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Clear Chat History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                isAi 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                  : 'bg-indigo-600 text-white'
              }`}>
                {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                isAi
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  : 'bg-emerald-500 text-white rounded-tr-none font-medium'
              }`}>
                <p>{m.text}</p>
                <span className={`block text-[10px] mt-1.5 opacity-60 text-right ${isAi ? 'text-slate-400' : 'text-emerald-100'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            <span>Chef Gemini is formulating recipe steps...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2 overflow-x-auto">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Prompt Bar Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
        <button
          onClick={toggleVoiceInput}
          className={`p-3 rounded-2xl transition-colors ${
            isListening 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500'
          }`}
          title="Voice Speech Input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask Chef Gemini e.g. 'What can I cook with paneer and spinach?'..."
          className="flex-1 py-3 px-4 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputPrompt.trim() || isLoading}
          className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white transition-all shadow-md shadow-emerald-500/20"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
