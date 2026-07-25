import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ArrowLeft, 
  Trash2, 
  Check, 
  Pin, 
  Heart,
  Calendar,
  Tag,
  MapPin,
  Barcode,
  Eye,
  Activity,
  Edit2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { PantryLocation, ProductCategory } from '../types';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    products, 
    updateProduct, 
    deleteProduct, 
    markProductUsed, 
    togglePinProduct, 
    toggleFavoriteProduct,
    openProduct
  } = usePantry();

  const product = products.find((p) => p.id === id);

  const [isEditing, setIsEditing] = useState(false);
  
  // Editing state fields
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [expiryDate, setExpiryDate] = useState(product?.expiryDate || '');
  const [location, setLocation] = useState<PantryLocation>(product?.location || 'Pantry');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'Other');
  const [quantity, setQuantity] = useState(product?.quantity || 1);
  const [notes, setNotes] = useState(product?.notes || '');
  const [mrp, setMrp] = useState(product?.mrp?.toString() || '');
  const [batch, setBatch] = useState(product?.batch || '');

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center flex flex-col items-center justify-center gap-4">
        <p className="font-bold text-slate-800 dark:text-slate-200">Product not found</p>
        <button onClick={() => navigate('/')} className="text-brand-600 font-semibold hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const getDaysLeft = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const daysLeft = getDaysLeft(product.expiryDate);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct(product.id, {
      name,
      brand,
      expiryDate,
      location,
      category,
      quantity,
      notes: notes || undefined,
      mrp: mrp ? Number(mrp) : undefined,
      batch: batch || undefined,
    });
    setIsEditing(false);
  };

  const handleMarkUsed = () => {
    markProductUsed(product.id);
    navigate('/');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product from inventory?')) {
      deleteProduct(product.id);
      navigate('/');
    }
  };

  // Timeline variables
  const timelineAddedStr = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0]; // Mock added 3 days ago

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">
            Inventory inspect / {product.name}
          </span>
        </div>

        {/* Favorite & Pin Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePinProduct(product.id)}
            className={`p-2.5 rounded-xl border transition-all ${
              product.pinned
                ? 'border-indigo-500/20 text-indigo-500 bg-indigo-500/5'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
            title="Pin Product to Widget"
          >
            <Pin className={`w-4 h-4 ${product.pinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => toggleFavoriteProduct(product.id)}
            className={`p-2.5 rounded-xl border transition-all ${
              product.isFavorite
                ? 'border-red-500/20 text-red-500 bg-red-500/5'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
            title="Mark Favorite"
          >
            <Heart className={`w-4 h-4 ${product.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Card Details & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Product Image, Details & Edit Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <GlassCard hoverEffect={false} className="p-6 md:p-8">
            {!isEditing ? (
              /* DETAILS VIEW */
              <div className="flex flex-col gap-6">
                
                {/* Visual Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-24 h-24 rounded-2xl object-cover border border-slate-100 dark:border-slate-800" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-4xl border border-slate-200 dark:border-slate-800">
                      🥛
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        product.status === 'expired' 
                          ? 'bg-red-500/10 text-red-500 border-red-500/25' 
                          : product.status === 'expiring' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' 
                            : 'bg-green-500/10 text-green-500 border-green-500/25'
                      }`}>
                        {product.status}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-850 font-bold">
                        Qty: {product.quantity}
                      </span>
                    </div>

                    <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white leading-tight">
                      {product.name}
                    </h2>
                    <p className="text-sm font-semibold text-slate-450 dark:text-slate-400">
                      by {product.brand}
                    </p>
                  </div>
                </div>

                {/* Meta details list */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Expiry Date</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {product.expiryDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Storage Shelf</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {product.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Category</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {product.barcode && (
                    <div className="flex items-center gap-3">
                      <Barcode className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Barcode</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {product.barcode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {product.notes && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Notes & Reminders</span>
                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                      {product.notes}
                    </p>
                  </div>
                )}

                {/* Extra Stats */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {product.mrp ? `$${product.mrp.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Batch Code</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {product.batch || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                  <button
                    onClick={handleMarkUsed}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    Mark Consumed
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-3 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-2xl"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              /* EDITING VIEW */
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-5">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 mb-2">Edit Product details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Shelf</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value as PantryLocation)}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-650 dark:text-slate-350"
                    >
                      {['Pantry', 'Refrigerator', 'Freezer', 'Medicine Cabinet', 'Bathroom', 'Kitchen Shelf'].map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-650 dark:text-slate-350"
                    >
                      {['Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="glass-input rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-255 text-slate-700 dark:text-slate-350 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>

        {/* Right Side: Product Expiry Life Timeline & Recipe Gen */}
        <div className="flex flex-col gap-6">
          {/* Life Timeline Visualization */}
          <GlassCard hoverEffect={false}>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-5">
              <Activity className="w-5 h-5 text-brand-650" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Lifecycle Timeline</h3>
            </div>

            <div className="relative flex flex-col gap-6 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {/* Added */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-4.5 h-4.5 rounded-full bg-green-500 border-4 border-white dark:border-slate-950 shadow-sm" />
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Product Added</span>
                <span className="text-xs font-bold text-slate-750 dark:text-slate-200 leading-tight block">
                  Logged into inventory
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Date: {timelineAddedStr}</span>
              </div>

              {/* Opened */}
              <div className="relative">
                <div className={`absolute -left-6 top-1 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-slate-950 shadow-sm ${
                  product.opened ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                }`} />
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Opened Date</span>
                
                {product.opened ? (
                  <>
                    <span className="text-xs font-bold text-slate-750 dark:text-slate-200 leading-tight block">
                      Opened package
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Date: {product.openedDate}</span>
                  </>
                ) : (
                  <button
                    onClick={() => openProduct(product.id)}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline text-left mt-0.5"
                  >
                    🔓 Mark opened today
                  </button>
                )}
              </div>

              {/* Expiry */}
              <div className="relative">
                <div className={`absolute -left-6 top-1 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-slate-950 shadow-sm ${
                  daysLeft < 0 ? 'bg-red-500' : daysLeft <= 2 ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Target Expiration</span>
                <span className="text-xs font-bold text-slate-750 dark:text-slate-200 leading-tight block">
                  {daysLeft < 0 ? 'Expired' : `${daysLeft} days remaining`}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Date: {product.expiryDate}</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Recipe Generator Helper */}
          <GlassCard className="flex flex-col justify-between h-[180px]">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Ingredient Cooking</h3>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
                Let AI generate a tailored recipe utilizing **{product.name}** before it gets wasted.
              </p>
            </div>
            <button
              onClick={() => navigate('/recipes', { state: { priorityIngredient: product.name } })}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              Generate Recipe
            </button>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
