import React, { useState } from 'react';
import { Barcode, Search, Check, ArrowLeft, Loader2, PackageCheck, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  onBack: () => void;
  onSaveProduct: (p: Partial<Product>) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  onBack,
  onSaveProduct,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('8901063092839');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted fields
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [imageUrl, setImageUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('Pantry');

  const handleLookup = async () => {
    if (!barcodeInput.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/openfoodfacts/${barcodeInput.trim()}`);
      if (!response.ok) {
        throw new Error('Barcode not found in OpenFoodFacts database.');
      }

      const data = await response.json();
      setProductName(data.productName || 'Scanned Product');
      setBrand(data.brand || '');
      if (data.category) setCategory(data.category);
      if (data.imageUrl) setImageUrl(data.imageUrl);

      // Default expiry date: 14 days from today
      const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      setExpiryDate(defaultDate);
    } catch (err: any) {
      console.error('Barcode lookup error:', err);
      setErrorMsg(err.message || 'Product details not found for this barcode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!productName || !expiryDate) {
      alert('Please fill in Product Name and Expiry Date.');
      return;
    }

    onSaveProduct({
      name: productName,
      brand: brand || undefined,
      category: category as any,
      barcode: barcodeInput,
      image: imageUrl || undefined,
      expiryDate,
      location: location as any,
      source: 'Barcode',
      quantity: 1,
      unit: 'pcs',
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
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
            <Barcode className="w-5 h-5 text-cyan-500" />
            Barcode Search (OpenFoodFacts)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fetch brand, name, category, and photo automatically from barcode
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
        
        {/* Barcode Search Bar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Enter Barcode Number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="e.g. 8901063092839 or 3017620422003"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isLoading || !barcodeInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Lookup</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form area if found */}
        {productName && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              {imageUrl ? (
                <img src={imageUrl} alt={productName} className="w-14 h-14 rounded-xl object-cover bg-white" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl">
                  📦
                </div>
              )}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{productName}</h4>
                <p className="text-xs text-slate-500">{brand || 'Brand unlisted'} • {category}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
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

            <button
              onClick={handleSave}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Add Product</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
