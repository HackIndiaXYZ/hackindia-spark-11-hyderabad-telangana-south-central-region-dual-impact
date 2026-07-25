import React, { useState, useRef, useEffect } from 'react';
import { usePantry } from '../context/PantryContext';
import { scanProductImage } from '../services/gemini';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import { 
  X, 
  Camera, 
  Upload, 
  Barcode, 
  AlertCircle, 
  Check, 
  Loader2, 
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCategory, PantryLocation } from '../types';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanTab = 'camera' | 'upload' | 'barcode';

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = usePantry();
  const [activeTab, setActiveTab] = useState<ScanTab>('camera');
  
  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Captured/Extracted Results
  const [previewData, setPreviewData] = useState<{
    name: string;
    brand: string;
    expiryDate: string;
    mfgDate: string;
    barcode: string;
    category: ProductCategory;
    location: PantryLocation;
    quantity: number;
    notes: string;
    mrp: number;
    batch: string;
    confidence: number;
  } | null>(null);

  // Input states for Manual OCR correction
  const [barcodeInput, setBarcodeInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPreviewData(null);
      setError('');
      setSuccess(false);
      setBarcodeInput('');
    } else {
      if (activeTab === 'camera') {
        startCamera();
      }
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions or try image upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Flip horizontally if front camera (optional), standard back camera normal drawing:
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        processImageOCR(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          processImageOCR(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform AI OCR Extraction
  const processImageOCR = async (base64Image: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await scanProductImage(base64Image);
      setPreviewData({
        name: result.name || 'Unknown Product',
        brand: result.brand || 'Generic Brand',
        expiryDate: result.expiryDate || new Date().toISOString().split('T')[0],
        mfgDate: result.mfgDate || '',
        barcode: result.barcode || '',
        category: (result.category as ProductCategory) || 'Other',
        location: 'Pantry', // Default location
        quantity: 1,
        notes: `AI OCR Extracted (Confidence: ${result.confidence}%)`,
        mrp: result.mrp || 0,
        batch: result.batch || '',
        confidence: result.confidence || 85,
      });
    } catch (err: any) {
      setError('AI failed to parse image details. Please try manual typing or a clearer photo.');
    } finally {
      setLoading(false);
    }
  };

  // Perform Barcode Lookup via OpenFoodFacts
  const handleBarcodeSearch = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchProductByBarcode(code);
      setPreviewData({
        name: data.name,
        brand: data.brand,
        expiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0], // Default 7 day
        mfgDate: '',
        barcode: data.barcode,
        category: data.category as ProductCategory,
        location: 'Pantry',
        quantity: 1,
        notes: `Barcode Search: ${data.healthFacts}`,
        mrp: data.price,
        batch: '',
        confidence: 100, // Barcodes are 100% precise
      });
    } catch (err: any) {
      setError('Product not found in OpenFoodFacts database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScanned = () => {
    if (previewData) {
      addProduct({
        name: previewData.name,
        brand: previewData.brand,
        expiryDate: previewData.expiryDate,
        mfgDate: previewData.mfgDate || undefined,
        barcode: previewData.barcode || undefined,
        category: previewData.category,
        location: previewData.location,
        quantity: previewData.quantity,
        notes: previewData.notes,
        mrp: previewData.mrp || undefined,
        batch: previewData.batch || undefined,
        opened: false,
        pinned: false,
        isFavorite: false
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                AI Smart Scanner
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error and Loading indicators */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="p-6 flex-1 flex flex-col">
            {!previewData ? (
              <>
                {/* Mode Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl mb-6">
                  {(['camera', 'upload', 'barcode'] as ScanTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-xs capitalize flex items-center justify-center gap-2 transition-all ${
                        activeTab === tab
                          ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
                      }`}
                    >
                      {tab === 'camera' && <Camera className="w-4 h-4" />}
                      {tab === 'upload' && <Upload className="w-4 h-4" />}
                      {tab === 'barcode' && <Barcode className="w-4 h-4" />}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Views */}
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-brand-600 dark:text-brand-400 animate-spin mb-4" />
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      Processing with AI Intelligence...
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Reading package, extracting dates and brand data.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* CAMERA SCAN TAB */}
                    {activeTab === 'camera' && (
                      <div className="flex flex-col gap-4">
                        {cameraError ? (
                          <div className="text-center py-10">
                            <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                              {cameraError}
                            </p>
                          </div>
                        ) : (
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                            <video
                              ref={videoRef}
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            {/* Scanning Red Overlay Line */}
                            {cameraActive && (
                              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-bounce" />
                            )}
                            
                            {!cameraActive && (
                              <button
                                onClick={startCamera}
                                className="absolute bg-white/10 backdrop-blur text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all"
                              >
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Restart Camera
                              </button>
                            )}
                          </div>
                        )}
                        {cameraActive && (
                          <button
                            onClick={capturePhoto}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30"
                          >
                            <Camera className="w-5 h-5" />
                            Capture & Scan
                          </button>
                        )}
                      </div>
                    )}

                    {/* UPLOAD FILE TAB */}
                    {activeTab === 'upload' && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-3xl p-10 text-center cursor-pointer transition-all hover:bg-brand-500/5 flex flex-col items-center justify-center gap-4 group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center group-hover:scale-105 transition-all">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Drag & drop your product image here
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Supports PNG, JPG, JPEG (AI will read dates & info)
                          </p>
                        </div>
                        <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold text-xs px-4 py-2 rounded-xl transition-all">
                          Browse files
                        </button>
                      </div>
                    )}

                    {/* BARCODE SEARCH TAB */}
                    {activeTab === 'barcode' && (
                      <div className="flex flex-col gap-4">
                        <div className="relative">
                          <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Enter 13-digit Barcode (e.g. 3017620422003)"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            className="w-full glass-input rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-150"
                          />
                        </div>
                        <button
                          onClick={() => handleBarcodeSearch(barcodeInput)}
                          disabled={!barcodeInput}
                          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30"
                        >
                          <Barcode className="w-5 h-5" />
                          Lookup OpenFoodFacts Product
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* PREVIEW AND ADJUSTMENT SCREEN */
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center bg-brand-500/5 p-4 rounded-2xl border border-brand-500/10">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Analysis Mode</span>
                      <span className="font-semibold text-xs text-brand-600 dark:text-brand-400">
                        Please review and adjust extracted values
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
                    <span className="font-bold text-sm text-green-600 dark:text-green-400">
                      {previewData.confidence}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Product Name</label>
                    <input
                      type="text"
                      value={previewData.name}
                      onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Brand */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Brand</label>
                    <input
                      type="text"
                      value={previewData.brand}
                      onChange={(e) => setPreviewData({ ...previewData, brand: e.target.value })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Expiry Date</label>
                    <input
                      type="date"
                      value={previewData.expiryDate}
                      onChange={(e) => setPreviewData({ ...previewData, expiryDate: e.target.value })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Mfg Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Manufacturing Date</label>
                    <input
                      type="date"
                      value={previewData.mfgDate}
                      onChange={(e) => setPreviewData({ ...previewData, mfgDate: e.target.value })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
                    <select
                      value={previewData.category}
                      onChange={(e) => setPreviewData({ ...previewData, category: e.target.value as ProductCategory })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      {['Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Store Location</label>
                    <select
                      value={previewData.location}
                      onChange={(e) => setPreviewData({ ...previewData, location: e.target.value as PantryLocation })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      {['Pantry', 'Refrigerator', 'Freezer', 'Medicine Cabinet', 'Bathroom', 'Kitchen Shelf'].map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Quantity</label>
                    <input
                      type="number"
                      value={previewData.quantity}
                      min={1}
                      onChange={(e) => setPreviewData({ ...previewData, quantity: Number(e.target.value) })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* MRP */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Price (MRP, optional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={previewData.mrp}
                        onChange={(e) => setPreviewData({ ...previewData, mrp: Number(e.target.value) })}
                        className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Batch Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Batch Number</label>
                    <input
                      type="text"
                      value={previewData.batch}
                      onChange={(e) => setPreviewData({ ...previewData, batch: e.target.value })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Barcode */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Barcode</label>
                    <input
                      type="text"
                      value={previewData.barcode}
                      onChange={(e) => setPreviewData({ ...previewData, barcode: e.target.value })}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                  <button
                    onClick={() => setPreviewData(null)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    Rescan
                  </button>
                  <button
                    onClick={handleSaveScanned}
                    className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30"
                  >
                    {success ? <Check className="w-4 h-4 animate-scale" /> : null}
                    {success ? 'Saved!' : 'Confirm & Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </AnimatePresence>
  );
};
