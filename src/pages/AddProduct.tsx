import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { ScannerModal } from '../components/ScannerModal';
import { 
  ArrowLeft, 
  Save, 
  ScanLine, 
  Trash2, 
  AlertCircle,
  Sparkles,
  Barcode,
  Calendar,
  Tag,
  MapPin
} from 'lucide-react';
import { ProductCategory, PantryLocation } from '../types';

export const AddProduct: React.FC = () => {
  const { addProduct } = usePantry();
  const navigate = useNavigate();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Other');
  const [location, setLocation] = useState<PantryLocation>('Pantry');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [barcode, setBarcode] = useState('');
  const [mrp, setMrp] = useState('');
  const [batch, setBatch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expiryDate) {
      setError('Product Name and Expiry Date are required fields.');
      return;
    }

    if (mfgDate && new Date(mfgDate) > new Date(expiryDate)) {
      setError('Manufacturing date cannot be after the expiration date.');
      return;
    }

    setError('');
    
    // Convert to target types
    addProduct({
      name,
      brand: brand || 'Generic Brand',
      expiryDate,
      mfgDate: mfgDate || undefined,
      barcode: barcode || undefined,
      category,
      location,
      quantity,
      notes: notes || undefined,
      mrp: mrp ? Number(mrp) : undefined,
      batch: batch || undefined,
      opened: false,
      pinned: false,
      isFavorite: false
    });

    navigate('/');
  };

  // Mock Barcode Autofills
  const triggerFastAutofill = () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 10);

    setName('Chobani Vanilla Yogurt');
    setBrand('Chobani');
    setCategory('Dairy');
    setLocation('Refrigerator');
    setQuantity(2);
    setExpiryDate(futureDate.toISOString().split('T')[0]);
    setBarcode('041820014022');
    setMrp('3.89');
    setBatch('CH-Y942');
    setNotes('Great yogurt for breakfast smoothies.');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      
      {/* Header Back Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
            Add New Item
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Enter product details manually or launch the camera scanner to auto-fill.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Side Panel Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Form Container */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <GlassCard hoverEffect={false} className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Milk, Amoxicillin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Brand */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kirkland, Driscoll's"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Mfg Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manufacturing Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350"
                    >
                      {['Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Storage Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pantry Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value as PantryLocation)}
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350"
                    >
                      {['Pantry', 'Refrigerator', 'Freezer', 'Medicine Cabinet', 'Bathroom', 'Kitchen Shelf'].map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Price / MRP */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price (MRP)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4.99"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Batch Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. L40A2"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Barcode */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barcode</label>
                  <div className="relative">
                    <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 5449000000996"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes / Reminders</label>
                  <textarea
                    placeholder="e.g. Keep in glass bottle, use for baking..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Product
                </button>
              </div>

            </form>
          </GlassCard>
        </div>

        {/* Side Panel: Scan and Helpers */}
        <div className="flex flex-col gap-6">
          <GlassCard className="flex flex-col justify-between h-[200px]">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <ScanLine className="w-5 h-5 text-brand-650" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Scan Product Pack</h3>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
                Let the AI extract all metadata automatically. Hold the package flat in front of the camera, or upload a photo.
              </p>
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <ScanLine className="w-4 h-4" />
              Open Camera Scanner
            </button>
          </GlassCard>

          {/* Quick Demo Autofill helper */}
          <GlassCard className="flex flex-col justify-between h-[180px]">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Fast Mock Autofill</h3>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
                Click below to instantly populate fields with high-quality mock data for testing.
              </p>
            </div>
            <button
              onClick={triggerFastAutofill}
              className="w-full bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-650 dark:text-indigo-400 font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Autofill Form
            </button>
          </GlassCard>
        </div>

      </div>

      <ScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

    </div>
  );
};
