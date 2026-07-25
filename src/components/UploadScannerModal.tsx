import React, { useState } from 'react';
import { Upload, FileImage, Check, ArrowLeft, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Product, OcrScanResult } from '../types';
import { sharpenImageData, thresholdImageData } from '../utils/imageFilters';

interface UploadScannerModalProps {
  onBack: () => void;
  onSaveProduct: (p: Partial<Product>) => void;
}

export const UploadScannerModal: React.FC<UploadScannerModalProps> = ({
  onBack,
  onSaveProduct,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrScanResult | null>(null);

  // Form states
  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('Dairy');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState('Kitchen');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result as string;
      setImagePreview(base64Str);
      setOcrResult(null);
      setProductName('');
      setExpiryDate('');
      setBrand('');
      setCategory('Dairy');
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          analyzeImage(base64Str, file.name);
          return;
        }

        const targetW = img.width;
        const targetH = img.height;
        canvas.width = targetW * 2;
        canvas.height = targetH * 2;

        // 1. Original (2x Upsampled)
        ctx.drawImage(img, 0, 0, targetW * 2, targetH * 2);
        const originalBase64 = canvas.toDataURL('image/jpeg', 0.90);

        // 2. Enhanced (Contrast Boost + Grayscale + Sharpen)
        ctx.clearRect(0, 0, targetW * 2, targetH * 2);
        ctx.filter = 'contrast(1.6) brightness(1.05) grayscale(1)';
        ctx.drawImage(img, 0, 0, targetW * 2, targetH * 2);
        sharpenImageData(ctx, targetW * 2, targetH * 2);
        const enhancedBase64 = canvas.toDataURL('image/jpeg', 0.90);

        // 3. Threshold (Binarized High Contrast Black & White)
        ctx.clearRect(0, 0, targetW * 2, targetH * 2);
        ctx.filter = 'contrast(2.0) brightness(1.0) grayscale(1)';
        ctx.drawImage(img, 0, 0, targetW * 2, targetH * 2);
        thresholdImageData(ctx, targetW * 2, targetH * 2);
        const thresholdBase64 = canvas.toDataURL('image/jpeg', 0.90);

        analyzeImage(originalBase64, file.name, enhancedBase64, thresholdBase64);
      };
      img.src = base64Str;
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (
    base64Data: string, 
    fileName?: string,
    enhancedBase64?: string,
    thresholdBase64?: string
  ) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ocr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64Data, 
          fileName,
          enhancedBase64,
          thresholdBase64
        }),
      });

      if (!response.ok) {
        throw new Error('OCR API failed');
      }

      const result: OcrScanResult = await response.json();
      setOcrResult(result);

      if (result.productName) setProductName(result.productName);
      if (result.expiryDate) {
        const parsed = parseToIsoDate(result.expiryDate);
        setExpiryDate(parsed || result.expiryDate);
      }
      if (result.category) setCategory(result.category);
      if (result.brand) setBrand(result.brand);
    } catch (err) {
      console.error('OCR Error:', err);
      setProductName('Uploaded Product');
      setExpiryDate(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!productName || !expiryDate) {
      alert('Please fill in Product Name and Expiry Date.');
      return;
    }

    onSaveProduct({
      name: productName,
      expiryDate,
      category: category as any,
      brand: brand || undefined,
      location: location as any,
      quantity,
      unit,
      image: imagePreview || undefined,
      source: 'Upload',
      ocrConfidence: ocrResult?.confidenceScore,
      batchNumber: ocrResult?.batchNumber,
      mrp: ocrResult?.mrp,
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40';
    if (score >= 0.5) return 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40';
    return 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40';
  };

  const parseToIsoDate = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}\-\d{2}\-\d{2}$/.test(dateStr)) return dateStr;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // MM/YYYY or MM-YYYY
    const myMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (myMatch) {
      const month = myMatch[1].padStart(2, '0');
      const year = myMatch[2];
      return `${year}-${month}-01`;
    }

    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      
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
            <Upload className="w-5 h-5 text-indigo-500" />
            Upload Product Image
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload an image of the product packaging or barcode for AI extraction
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xl">
        {!imagePreview ? (
          /* Dropzone Upload View */
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer relative group">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Select or Drop Product Image
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Supports JPEG, PNG up to 10MB. Expiry dates, brands, and categories are extracted automatically.
            </p>
          </div>
        ) : (
          /* Image Preview and Form View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Image Preview Card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-square">
              <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Gemini AI analyzing picture...
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setImagePreview(null);
                  setOcrResult(null);
                  setProductName('');
                  setExpiryDate('');
                  setBrand('');
                  setCategory('Dairy');
                }}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-medium backdrop-blur-md flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change Image
              </button>
            </div>

            {/* Editable Details Form */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Extracted Product Details
                </h3>
                {ocrResult?.confidenceScore !== undefined && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getConfidenceColor(ocrResult.confidenceScore)}`}>
                    AI Score: {Math.round(ocrResult.confidenceScore * 100)}%
                  </span>
                )}
              </div>

              {ocrResult?.reason && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">AI Logic: </span>
                  {ocrResult.reason}
                  {ocrResult.detectionMethod && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-200 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-[9px] font-bold uppercase tracking-wider">
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
                  placeholder="e.g. Britannia Cookies"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {ocrResult?.expiryDate && (
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>Detected on package:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{ocrResult.expiryDate}</span>
                  </p>
                )}
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
                    Location
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
                  onClick={handleSave}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Product</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
