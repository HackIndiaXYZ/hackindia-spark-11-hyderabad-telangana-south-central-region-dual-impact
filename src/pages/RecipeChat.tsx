import React, { useState, useEffect, useRef } from 'react';
import { usePantry } from '../context/PantryContext';
import { chatWithKitchenAssistant } from '../services/gemini';
import { GlassCard } from '../components/GlassCard';
import { 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Trash2, 
  Bot, 
  User, 
  Loader2,
  Volume2,
  VolumeX,
  HelpCircle,
  Clock
} from 'lucide-react';
import { ChatMessage } from '../types';
import { motion } from 'framer-motion';

export const RecipeChat: React.FC = () => {
  const { products } = usePantry();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('se_chat_history');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // Default Welcome Message
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        text: "👋 Hello! I'm your Smart Kitchen AI Assistant. You can ask me recipe ideas, food safety rules, shelf-life guidelines, or how to freeze ingredients. What are you cooking today?",
        timestamp: Date.now()
      };
      setMessages([welcome]);
    }
  }, []);

  // Sync scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Configure Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputText(text);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const saveHistory = (chatLogs: ChatMessage[]) => {
    setMessages(chatLogs);
    localStorage.setItem('se_chat_history', JSON.stringify(chatLogs));
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    const updated = [...messages, userMsg];
    saveHistory(updated);
    setInputText('');
    setLoading(true);

    try {
      const responseText = await chatWithKitchenAssistant(textToSend, updated, products);
      const aiMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        sender: 'ai',
        text: responseText,
        timestamp: Date.now()
      };
      saveHistory([...updated, aiMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: 'msg-ai-err-' + Date.now(),
        sender: 'ai',
        text: "Sorry, I ran into an error communicating with the AI server. Please verify your Gemini API key in Settings.",
        timestamp: Date.now()
      };
      saveHistory([...updated, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all chat logs?')) {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        text: "👋 Chat history cleared. Ask me anything about cooking, shelf-life, or recipes!",
        timestamp: Date.now()
      };
      saveHistory([welcome]);
    }
  };

  const suggestedPrompts = [
    "What expires tomorrow?",
    "Can I freeze fresh strawberries?",
    "How long can milk stay outside the fridge?",
    "Is expired medicine safe?",
    "What can I cook using milk and eggs?"
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col h-[85vh] gap-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-850 dark:text-white leading-tight">
              AI Smart Assistant
            </h1>
            <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 block mt-0.5">
              Powered by Gemini model
            </span>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 transition-all"
          title="Clear Chat Logs"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Prompts Shelf (Horizontal scrolling) */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 shrink-0 select-none no-scrollbar">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="glass hover:border-brand-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-350 whitespace-nowrap transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread Box */}
      <div className="flex-1 glass border border-slate-200 dark:border-slate-850 rounded-3xl p-5 md:p-6 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[85%] ${
                isAI ? 'self-start' : 'self-end flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                isAI 
                  ? 'bg-brand-500/10 text-brand-600' 
                  : 'bg-indigo-500/10 text-indigo-600'
              }`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message text card */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                isAI 
                  ? 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-150' 
                  : 'bg-brand-600 text-white shadow-md'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 self-start items-center">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">
              AI kitchen is typing...
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input box section */}
      <div className="shrink-0 flex gap-3 items-center">
        {/* Text Area Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type your cooking question here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            className="w-full glass-input rounded-2xl pl-4 pr-12 py-3.5 text-xs font-semibold text-slate-850 dark:text-slate-150"
          />
          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Voice Input dictation"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Send Action */}
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs p-3.5 rounded-2xl shadow-lg shadow-brand-500/20 cursor-pointer shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>

    </div>
  );
};
