import React from 'react';
import { Camera, Upload, Barcode, ArrowLeft, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface ScanModalProps {
  onSelectMethod: (method: 'camera' | 'upload' | 'barcode') => void;
  onBackToDashboard: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  onSelectMethod,
  onBackToDashboard,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBackToDashboard}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Smart Expiry Scanner
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI-powered OCR + Barcode scanner with expiry alerts
          </p>
        </div>
      </div>

      {/* Main Choice Card Container matching screenshot #1 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-10 text-center max-w-2xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Choose scanning method
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Use your camera or upload an existing image to auto-detect dates
        </p>

        {/* 2 or 3 Method Cards matching screenshot #1 styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Method 1: Open Camera (Teal/Cyan gradient like screenshot #1) */}
          <button
            onClick={() => onSelectMethod('camera')}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[180px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Open Camera
            </h3>
            <p className="text-xs text-white/80">
              Scan in real-time
            </p>
          </button>

          {/* Method 2: Upload Image (Purple/Violet gradient like screenshot #1) */}
          <button
            onClick={() => onSelectMethod('upload')}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[180px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Upload Image
            </h3>
            <p className="text-xs text-white/80">
              Choose from gallery
            </p>
          </button>

        </div>

        {/* Secondary Barcode Option */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onSelectMethod('barcode')}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Barcode className="w-4 h-4 text-emerald-500" />
            <span>Search via Barcode / OpenFoodFacts</span>
          </button>
        </div>

        {/* Gemini Vision Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Powered by Gemini 3.6 Flash Multimodal Vision API</span>
        </div>
      </div>

    </div>
  );
};
