import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Product, OcrScanResult } from '../types';

interface CameraScannerModalProps {
  onBack: () => void;
  onSaveProduct: (p: Partial<Product>) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  onBack,
  onSaveProduct,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrScanResult | null>(null);

  // Form fields for editing detected data
  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('Dairy');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState('Kitchen');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image.');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    stopCamera();
    setIsAnalyzing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 480;

      // Stage 1: Auto Crop to Viewfinder Reticle (3/4 width, 1/2 height in center)
      const cropWidth = Math.floor(vWidth * 0.75);
      const cropHeight = Math.floor(vHeight * 0.50);
      const cropX = Math.floor((vWidth - cropWidth) / 2);
      const cropY = Math.floor((vHeight - cropHeight) / 2);

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Image Preprocessing: Enhancing contrast, grayscaling, and sharpening for OCR readability
      ctx.filter = 'contrast(1.45) brightness(1.05) grayscale(0.2) saturate(1.1)';
      ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      setCapturedImage(dataUrl);

      const response = await fetch('/api/ocr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      if (!response.ok) {
        throw new Error('OCR API returned error');
      }

      const result: OcrScanResult = await response.json();
      setOcrResult(result);

      if (result.productName) setProductName(result.productName);
      if (result.expiryDate) setExpiryDate(result.expiryDate);
      if (result.category) setCategory(result.category);
      if (result.brand) setBrand(result.brand);
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback
      setProductName('Scanned Item');
      setExpiryDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40';
    if (score >= 0.5) return 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40';
    return 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40';
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult(null);
    startCamera();
  };

  const handleConfirmSave = () => {
    if (!productName || !expiryDate) {
      alert('Please provide at least Product Name and Expiry Date.');
      return;
    }

    onSaveProduct({
      name: productName,
      expiryDate,
      category: category as any,
      brand: brand || undefined,
      location: location as any,
      image: capturedImage || undefined,
      source: 'Camera',
      quantity: 1,
      unit: 'pcs',
      ocrConfidence: ocrResult?.confidenceScore,
      batchNumber: ocrResult?.batchNumber,
      mrp: ocrResult?.mrp,
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" />
            Live Camera OCR Scan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Position expiry date label within frame for automatic detection
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xl">
        {!capturedImage ? (
          /* Live Stream View */
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[420px] flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-rose-400 max-w-md">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-semibold">{cameraError}</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  playsInline 
                  muted 
                />

                {/* Framing Viewfinder Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/4 h-1/2 border-2 border-dashed border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center">
                    <span className="text-[11px] font-medium text-emerald-300 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Align Expiry Date / Package Label
                    </span>
                  </div>
                </div>

                {/* Capture Button */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={captureFrameAndAnalyze}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 transition-transform active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Scan Product</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Analyzing / Confirmation Form View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Captured Image Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Gemini AI extracting expiry & product details...
                    </p>
                  </div>
                )}
                <button
                  onClick={handleRetake}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-medium backdrop-blur-md flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Photo
                </button>
              </div>

              {/* Editable Form Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Verified Product Information
                  </h3>
                  {ocrResult?.confidenceScore !== undefined && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getConfidenceColor(ocrResult.confidenceScore)}`}>
                      Confidence: {Math.round(ocrResult.confidenceScore * 100)}%
                    </span>
                  )}
                </div>

                {ocrResult?.reason && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">AI Logic: </span>
                    {ocrResult.reason} 
                    {ocrResult.detectionMethod && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold uppercase tracking-wider">
                        {ocrResult.detectionMethod}
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Milk, Aspirin, Bread"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Expiry Date *
                  </label>
                  {ocrResult && !expiryDate && (
                    <div className="p-2.5 mb-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-semibold border border-rose-100 dark:border-rose-900/30">
                      ⚠️ No expiry date detected. Please enter it manually.
                    </div>
                  )}
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                    >
                      {['Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Storage Location
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                    >
                      {['Kitchen', 'Refrigerator', 'Medicine Box', 'Shelf', 'Pantry', 'Freezer', 'Other'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConfirmSave}
                    disabled={isAnalyzing}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save to Inventory</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
