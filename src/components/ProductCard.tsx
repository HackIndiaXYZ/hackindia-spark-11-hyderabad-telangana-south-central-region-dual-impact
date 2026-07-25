import React from 'react';
import { 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Camera, 
  Upload, 
  Barcode, 
  Edit,
  Utensils,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types';
import { getDaysUntilExpiry, getExpiryStatus, formatDateDisplay } from '../utils/dateUtils';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onMarkUsed: (id: string) => void;
  onGenerateRecipeForProduct: (p: Product) => void;
  onEditProduct: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onDeleteProduct,
  onMarkUsed,
  onGenerateRecipeForProduct,
  onEditProduct,
}) => {
  const status = getExpiryStatus(product.expiryDate);
  const daysLeft = getDaysUntilExpiry(product.expiryDate);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Camera': return <Camera className="w-3 h-3" />;
      case 'Upload': return <Upload className="w-3 h-3" />;
      case 'Barcode': return <Barcode className="w-3 h-3" />;
      default: return null;
    }
  };

  const statusBadgeStyle = {
    'Fresh': 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    'Expiring Soon': 'bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    'Expired': 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800',
  }[status];

  return (
    <div className={`
      group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden flex flex-col justify-between
      ${product.isUsed 
        ? 'opacity-60 border-[#E2E4E9] dark:border-slate-800 grayscale-[0.2]' 
        : status === 'Expired'
          ? 'border-red-200 dark:border-red-900/50 hover:border-red-300'
          : status === 'Expiring Soon'
            ? 'border-orange-200 dark:border-orange-900/50 hover:border-orange-300'
            : 'border-[#E2E4E9] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }
    `}>
      {/* Thumbnail Image Container */}
      <div 
        onClick={() => onSelectProduct(product)}
        className="relative h-44 sm:h-48 w-full bg-slate-50 dark:bg-slate-800 cursor-pointer overflow-hidden"
      >
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4 text-center">
            <span className="text-3xl mb-1">📦</span>
            <span className="text-xs font-medium">No Image</span>
          </div>
        )}

        {/* Days Left Overlay Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`
            text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md border
            ${daysLeft < 0 
              ? 'bg-red-600/90 text-white border-red-400/50' 
              : daysLeft <= 3 
                ? 'bg-orange-500/90 text-white border-orange-400/50'
                : 'bg-[#1A1C1E]/80 text-white border-slate-700/50'
            }
          `}>
            {daysLeft < 0 
              ? `${Math.abs(daysLeft)}d Expired` 
              : daysLeft === 0 
                ? 'Expires Today' 
                : `${daysLeft} days left`
            }
          </span>
        </div>

        {/* Location Badge */}
        {product.location && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-sm border border-[#E2E4E9] dark:border-slate-700/50">
              <MapPin className="w-2.5 h-2.5 text-teal-600" />
              {product.location}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Brand */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 
              onClick={() => onSelectProduct(product)}
              className="font-bold text-base text-[#1A1C1E] dark:text-white leading-tight cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors line-clamp-1"
            >
              {product.name}
            </h3>
            <button
              onClick={() => onEditProduct(product)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit product details"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tags / Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeStyle}`}>
              {status}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
              {getSourceIcon(product.source)}
              {product.source}
            </span>
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Expires: {formatDateDisplay(product.expiryDate)}</span>
          </div>
        </div>

        {/* Recipe Suggestion Button if Expiring Soon */}
        {(status === 'Expiring Soon' || status === 'Fresh') && !product.isUsed && (
          <button
            onClick={() => onGenerateRecipeForProduct(product)}
            className="mt-3 w-full py-1.5 px-3 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>AI Recipe Suggestion</span>
          </button>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#E2E4E9] dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => onDeleteProduct(product.id)}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors py-1 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {!product.isUsed ? (
            <button
              onClick={() => onMarkUsed(product.id)}
              className="flex items-center gap-1 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Mark Used</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Used
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
