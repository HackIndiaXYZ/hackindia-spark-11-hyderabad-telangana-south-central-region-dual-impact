import React, { useState } from 'react';
import { PlusCircle, Upload, ArrowLeft, Check, Image as ImageIcon } from 'lucide-react';
import { Product, ProductCategory, ProductLocation } from '../types';

interface AddProductModalProps {
  onBack: () => void;
  onSaveProduct: (p: Partial<Product>) => void;
  initialData?: Partial<Product>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  onBack,
  onSaveProduct,
  initialData,
}) => {
  const [productName, setProductName] = useState(initialData?.name || '');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || '');
  const [mfdDate, setMfdDate] = useState(initialData?.mfdDate || '');
  const [category, setCategory] = useState<ProductCategory>(initialData?.category || 'Other');
  const [location, setLocation] = useState<ProductLocation>(initialData?.location || 'Kitchen');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [unit, setUnit] = useState(initialData?.unit || 'pcs');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [image, setImage] = useState(initialData?.image || '');

  const categories: ProductCategory[] = [
    'Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 
    'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'
  ];

  const locations: ProductLocation[] = [
    'Kitchen', 'Refrigerator', 'Medicine Box', 'Shelf', 'Pantry', 'Freezer', 'Other'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !expiryDate) {
      alert('Please fill in Product Name and Expiry Date.');
      return;
    }

    onSaveProduct({
      name: productName.trim(),
      expiryDate,
      mfdDate: mfdDate || undefined,
      category,
      location,
      brand: brand.trim() || undefined,
      quantity,
      unit,
      price: price > 0 ? price : undefined,
      notes: notes.trim() || undefined,
      image: image || undefined,
      source: 'Manual',
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          type="button"
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-500" />
            Add Product Manually
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter product details and expiry date
          </p>
        </div>
      </div>

      {/* Main Form matching screenshot #2 */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="text-emerald-500">+</span> Product Information
          </h3>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Milk, Aspirin, Bread"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Expiry Date & Mfd Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expiry Date *
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Manufacturing Date (Optional)
            </label>
            <input
              type="date"
              value={mfdDate}
              onChange={(e) => setMfdDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Storage Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as ProductLocation)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand, Quantity, Price */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Horizon"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Price ($ / ₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Product Image (Optional) matching screenshot #2 upload box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Product Image (Optional)
          </label>
          <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            {image ? (
              <div className="flex items-center gap-3">
                <img src={image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border" />
                <span className="text-xs text-emerald-600 font-semibold">Image uploaded (click to replace)</span>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <span className="text-xs font-medium block">Click to upload image</span>
              </div>
            )}
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Storage Instructions
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Keep refrigerated below 4°C"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Product</span>
          </button>
        </div>

      </form>
    </div>
  );
};
