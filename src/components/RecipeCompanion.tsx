import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles,
  Info,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecipeCompanionProps {
  recipe: Recipe;
  onClose: () => void;
  onCookComplete: () => void;
}

export const RecipeCompanion: React.FC<RecipeCompanionProps> = ({ 
  recipe, 
  onClose,
  onCookComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [initialTimerSetting, setInitialTimerSetting] = useState(0); // in seconds
  
  const steps = recipe.instructions;
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  // Initialize timer with recipe cooking time or default 5 mins
  useEffect(() => {
    const totalMins = recipe.cookTime > 0 ? recipe.cookTime : 5;
    setInitialTimerSetting(totalMins * 60);
    setTimerSeconds(totalMins * 60);
  }, [recipe]);

  // Countdown timer logic
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      triggerTimerAlert();
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // Read current step on load/change (if not muted)
  useEffect(() => {
    if (!isMuted) {
      speakCurrentStep();
    }
  }, [currentStep, isMuted]);

  const speakCurrentStep = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const stepText = `Step ${currentStep + 1}. ${steps[currentStep]}`;
      const utterance = new SpeechSynthesisUtterance(stepText);
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerTimerAlert = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Timer finished! Check your cooking.");
      window.speechSynthesis.speak(utterance);
    }
    // Simple browser alert fallback
    alert("⏰ Cooking Timer Finished!");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Cook finished!
      onCookComplete();
      alert("🎉 Congratulations! You have finished cooking this recipe.");
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(initialTimerSetting);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl glass rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[80vh] z-10"
      >
        
        {/* Left Side: Step Guide & Voice Controls */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto border-r border-slate-100 dark:border-slate-800">
          
          {/* Top Info Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Cooking Assistant</span>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{recipe.name}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl border transition-all ${
                  isMuted 
                    ? 'border-red-500/20 text-red-500 bg-red-500/5' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title={isMuted ? "Enable Voice Assistant" : "Mute Voice Assistant"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="my-6">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span>PROGRESS</span>
              <span>{currentStep + 1} of {steps.length} ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-brand-600 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Current Step Instruction Text */}
          <div className="flex-1 flex flex-col justify-center py-6 min-h-[160px]">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                Step {currentStep + 1}
              </span>
              <p className="text-lg md:text-xl font-semibold text-slate-850 dark:text-slate-100 leading-relaxed">
                {steps[currentStep]}
              </p>
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 inline mr-1" />
              Back
            </button>

            <button
              onClick={speakCurrentStep}
              className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300 text-xs font-bold flex items-center gap-1.5 hover:bg-brand-500/15"
            >
              <Volume2 className="w-4 h-4" />
              Repeat Audio
            </button>

            <button
              onClick={nextStep}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition-all"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Finish Cook
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Side: Kitchen Timer & Ingredients/Tips Drawer */}
        <div className="w-full md:w-80 p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto flex flex-col gap-6">
          
          {/* Smart Kitchen Timer Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <Timer className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Kitchen Timer</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="text-3xl font-mono font-bold text-slate-850 dark:text-slate-100 tracking-wider">
                {formatTime(timerSeconds)}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleTimer}
                  className={`p-2.5 rounded-xl text-white ${
                    timerActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600 hover:bg-brand-700'
                  } transition-all shadow-md`}
                >
                  {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Substitutes and Tips Widget */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Ingredients Substitutes */}
            {recipe.substitutes && Object.keys(recipe.substitutes).length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ingredient Substitutes</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(recipe.substitutes).map(([ing, sub]) => (
                    <div key={ing} className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">{ing}</span>
                      <span className="text-slate-500 dark:text-slate-450">Use instead: {sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Tips */}
            {recipe.tips && recipe.tips.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chef's Pro Tips</span>
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  {recipe.tips.slice(0, 3).map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes */}
            {recipe.mistakes && recipe.mistakes.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Avoid These Mistakes</span>
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  {recipe.mistakes.slice(0, 2).map((mistake, idx) => (
                    <li key={idx}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Storage and leftovers */}
            {recipe.storage && (
              <div className="bg-brand-500/5 border border-brand-500/10 p-3.5 rounded-xl flex gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">Leftover & Storage</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                    {recipe.storage}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </motion.div>
    </div>
  );
};
