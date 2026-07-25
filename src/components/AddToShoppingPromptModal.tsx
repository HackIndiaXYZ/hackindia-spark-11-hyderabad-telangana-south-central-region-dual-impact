import React, { useState } from 'react';
import { ShoppingBag, X, Check, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { Product, ProductCategory, PriorityLevel, ShoppingItem } from '../types';

interface AddToShoppingPromptModalProps {
  productName: string;
  category: ProductCategory;
  unit?: string;
  reason: string;
  onConfirm: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'isPurchased'>) => void;
  onCancel: () => void;
}

export const AddToShoppingPromptModal: React.FC<AddToShoppingPromptModalProps> = ({
  productName,
  category,
  unit = 'pcs',
  reason,
  onConfirm,
  onCancel,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [notes, setNotes] = useState<string>(`Auto-suggested: ${reason}`);

  const handleAdd = () => {
    onConfirm({
      name: productName,
      category: category,
      quantity: Math.max(1, quantity),
      unit: unit,
      priority: priority,
      notes: notes,
      reason: reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#E2E4E9] dark:border-slate-800 p-6 overflow-hidden">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E4E9] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1C1E] dark:text-white">
                Add to Shopping List?
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Keep your pantry restocked automatically
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-base text-[#1A1C1E] dark:text-white">
                {productName}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {reason}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Category: <strong className="text-slate-700 dark:text-slate-300">{category}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Restock Quantity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 font-semibold"
                />
                <span className="text-xs font-medium text-slate-400">{unit}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Notes / Store Preference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Buy Organic or Whole Foods"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#E2E4E9] dark:border-slate-800">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#E2E4E9] dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Add to List</span>
          </button>
        </div>

      </div>
    </div>
  );
};
