import React from 'react';
import { 
  X, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Barcode, 
  Edit, 
  Utensils, 
  Share2, 
  Copy, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { getDaysUntilExpiry, getExpiryStatus, formatDateDisplay, getExpiryLabel } from '../utils/dateUtils';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMarkUsed: (id: string) => void;
  onGenerateRecipe: (p: Product) => void;
  onEdit: (p: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onDelete,
  onMarkUsed,
  onGenerateRecipe,
  onEdit,
}) => {
  if (!product) return null;

  const status = getExpiryStatus(product.expiryDate);
  const daysLeft = getDaysUntilExpiry(product.expiryDate);

  const copyDetails = () => {
    const text = `Product: ${product.name}\nBrand: ${product.brand || 'N/A'}\nExpiry Date: ${product.expiryDate}\nStatus: ${status}\nLocation: ${product.location}`;
    navigator.clipboard.writeText(text);
    alert('Product details copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image Header */}
        <div className="relative h-56 sm:h-64 bg-slate-800 shrink-0">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-5xl mb-2">📦</span>
              <span className="text-xs">No Product Image Available</span>
            </div>
          )}

          {/* Floating Status Badges */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md ${
              daysLeft < 0 
                ? 'bg-rose-500 text-white' 
                : daysLeft <= 7 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-emerald-500 text-white'
            }`}>
              {getExpiryLabel(product.expiryDate)}
            </span>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
              {product.category}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Header Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h2>
              {product.brand && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Brand: {product.brand}
                </p>
              )}
            </div>

            <button
              onClick={copyDetails}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              title="Copy details"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Expiry Date</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                {formatDateDisplay(product.expiryDate)}
              </span>
            </div>

            {product.mfdDate && (
              <div>
                <span className="text-slate-400 block mb-0.5">MFD / PKD Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateDisplay(product.mfdDate)}
                </span>
              </div>
            )}

            <div>
              <span className="text-slate-400 block mb-0.5">Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {product.location}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Quantity</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {product.quantity} {product.unit}
              </span>
            </div>

            {product.barcode && (
              <div>
                <span className="text-slate-400 block mb-0.5">Barcode</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-indigo-500" />
                  {product.barcode}
                </span>
              </div>
            )}

            {product.batchNumber && (
              <div>
                <span className="text-slate-400 block mb-0.5">Batch No.</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {product.batchNumber}
                </span>
              </div>
            )}
          </div>

          {/* Notes section */}
          {product.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Notes & Storage Instructions
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {product.notes}
              </p>
            </div>
          )}

          {/* AI Recipe CTA */}
          <button
            onClick={() => {
              onClose();
              onGenerateRecipe(product);
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Utensils className="w-5 h-5" />
              <span>Generate Gemini Recipe with this product</span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>

        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onDelete(product.id);
            }}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>

            {!product.isUsed ? (
              <button
                onClick={() => {
                  onClose();
                  onMarkUsed(product.id);
                }}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Used</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-600 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Marked Used
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
