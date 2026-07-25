import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext';
import { Mic, MicOff, Volume2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Declare Web Speech API types
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface VoiceAssistantProps {
  onOpenScanner: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onOpenScanner }) => {
  const navigate = useNavigate();
  const { products, addProduct } = usePantry();
  
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
        setAssistantResponse('');
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setTranscript('Error listening. Try again.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        handleVoiceCommand(resultText);
      };

      recognitionRef.current = rec;
    }
  }, [products]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!isSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsOpen(true);
      recognitionRef.current.start();
    }
  };

  const handleVoiceCommand = (command: string) => {
    const cleanCommand = command.toLowerCase().trim();
    console.log('Voice Command received:', cleanCommand);

    // 1. Open Scanner
    if (cleanCommand.includes('scan') || cleanCommand.includes('camera')) {
      const response = "Opening camera scanner now.";
      setAssistantResponse(response);
      speakText(response);
      setTimeout(() => {
        onOpenScanner();
        setIsOpen(false);
      }, 1000);
      return;
    }

    // 2. What expires tomorrow
    if (cleanCommand.includes('expire') || cleanCommand.includes('tomorrow') || cleanCommand.includes('spoiling')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const expiringItems = products.filter(
        (p) => p.expiryDate === tomorrowStr || p.status === 'expiring'
      );

      if (expiringItems.length === 0) {
        const response = "You have no items expiring tomorrow or marked as expiring soon.";
        setAssistantResponse(response);
        speakText(response);
      } else {
        const names = expiringItems.map(p => p.name).join(', ');
        const response = `You have ${expiringItems.length} items expiring soon, which are: ${names}. You should cook them soon!`;
        setAssistantResponse(response);
        speakText(response);
      }
      return;
    }

    // 3. Add Milk / Add item
    if (cleanCommand.startsWith('add ')) {
      const itemToAdd = cleanCommand.substring(4);
      if (itemToAdd) {
        const capitalizedItem = itemToAdd.charAt(0).toUpperCase() + itemToAdd.slice(1);
        
        // Auto calculate default 7 day expiry
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 7);

        addProduct({
          name: capitalizedItem,
          brand: 'Kitchen Inventory',
          expiryDate: defaultExpiry.toISOString().split('T')[0],
          category: 'Other',
          quantity: 1,
          location: 'Pantry',
          opened: false,
          pinned: false,
          isFavorite: false
        });

        const response = `Added ${capitalizedItem} to your pantry with a default seven-day expiration.`;
        setAssistantResponse(response);
        speakText(response);
      }
      return;
    }

    // 4. Show grocery list
    if (cleanCommand.includes('grocery') || cleanCommand.includes('shopping')) {
      const response = "Opening your grocery shopping list.";
      setAssistantResponse(response);
      speakText(response);
      setTimeout(() => {
        navigate('/groceries');
        setIsOpen(false);
      }, 1000);
      return;
    }

    // 5. Open Pantry
    if (cleanCommand.includes('pantry') || cleanCommand.includes('fridge') || cleanCommand.includes('refrigerator')) {
      const response = "Opening your digital pantry locations view.";
      setAssistantResponse(response);
      speakText(response);
      setTimeout(() => {
        navigate('/pantry');
        setIsOpen(false);
      }, 1000);
      return;
    }

    // 6. Generate recipes
    if (cleanCommand.includes('recipe') || cleanCommand.includes('cook') || cleanCommand.includes('meal')) {
      const response = "Let's search for some recipes. Navigating to the AI Recipe generator.";
      setAssistantResponse(response);
      speakText(response);
      setTimeout(() => {
        navigate('/recipes');
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Fallback response
    const defaultResponse = `I heard "${command}". You can say "scan product", "what expires tomorrow?", "add milk", or "show grocery list".`;
    setAssistantResponse(defaultResponse);
    speakText(defaultResponse);
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Floating Activation Button */}
      <motion.button
        onClick={() => {
          setIsOpen(true);
          toggleListening();
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40"
        title="Activate Voice Assistant"
      >
        {isListening ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Pulsing wave animations */}
            <span className="absolute animate-ping inline-flex h-10 w-10 rounded-full bg-white opacity-40"></span>
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </motion.button>

      {/* Voice Assistant Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 right-6 z-40 w-80 glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="font-semibold text-sm">AI Voice Assistant</span>
              </div>
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mic Wave Animation & Status */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <motion.button
                onClick={toggleListening}
                animate={isListening ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md ${
                  isListening
                    ? 'bg-red-500 shadow-red-500/20'
                    : 'bg-brand-600 shadow-brand-500/20'
                }`}
              >
                {isListening ? <Mic className="w-8 h-8 animate-bounce" /> : <MicOff className="w-8 h-8" />}
              </motion.button>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
                {isListening ? 'Listening to your command...' : 'Tap microphone to speak'}
              </span>
            </div>

            {/* Sub-text Display (Transcript & Response) */}
            <div className="flex flex-col gap-2 min-h-16 text-sm">
              <div className="text-slate-700 dark:text-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">You said:</span>
                <p className="italic font-medium">{transcript || '"Try saying: add butter"'}</p>
              </div>

              {assistantResponse && (
                <div className="text-slate-800 dark:text-slate-100 bg-brand-500/5 p-2 rounded-lg border border-brand-500/10 flex gap-2">
                  <Volume2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">AI Kitchen:</span>
                    <p className="font-semibold text-xs leading-relaxed">{assistantResponse}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tip guide */}
            <div className="text-[10px] text-slate-400 leading-normal">
              <span className="font-semibold block mb-0.5">Try saying:</span>
              • "What expires tomorrow?"<br />
              • "Add Milk"<br />
              • "Scan product"<br />
              • "Show grocery list"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
