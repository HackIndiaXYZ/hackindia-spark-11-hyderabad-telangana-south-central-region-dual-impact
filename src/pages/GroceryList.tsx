import React, { useState, useMemo } from 'react';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { 
  Plus, 
  Trash2, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  AlertCircle,
  TrendingUp,
  FolderHeart,
  Tag,
  Sliders,
  DollarSign
} from 'lucide-react';
import { GroceryItem } from '../types';

export const GroceryList: React.FC = () => {
  const { groceryList, addGroceryItem, toggleGroceryItem, deleteGroceryItem, clearCheckedGrocery, updateGroceryItem } = usePantry();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Dairy');
  const [cost, setCost] = useState('3.50');
  
  const [copied, setCopied] = useState(false);

  const totalCost = useMemo(() => {
    return groceryList
      .filter((g) => !g.checked)
      .reduce((sum, item) => sum + item.estimatedCost, 0);
  }, [groceryList]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addGroceryItem({
      name,
      quantity,
      priority,
      category,
      estimatedCost: cost ? Number(cost) : 2.50
    });

    setName('');
    setQuantity('1');
    setCost('3.00');
  };

  const handleCopyClipboard = () => {
    const listText = groceryList
      .filter((g) => !g.checked)
      .map((g) => `- [ ] ${g.name} (${g.quantity}) - Est: $${g.estimatedCost.toFixed(2)} [${g.priority.toUpperCase()}]`)
      .join('\n');
    
    navigator.clipboard.writeText(`🛒 SMART KITCHEN GROCERY LIST:\n\n${listText || 'No items!'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8 print:p-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
            Grocery Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Smart shopping list auto-populated from kitchen consumption and meal planning gaps.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={handleCopyClipboard}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Markdown' : 'Copy List'}
          </button>
          <button
            onClick={handlePrint}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print List
          </button>
        </div>
      </div>

      {/* Stats Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <GlassCard hoverEffect={false} className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Total Active Items</span>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              {groceryList.filter(g => !g.checked).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-550 flex items-center justify-center">
            <FolderHeart className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard hoverEffect={false} className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Estimated Budget</span>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              ${totalCost.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-550 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard hoverEffect={false} className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Action Plan</span>
            <button
              onClick={clearCheckedGrocery}
              className="text-xs font-bold text-red-500 hover:underline mt-1 block"
            >
              Clear Checked Purchases
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-550 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
        </GlassCard>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Form: Add Item (Hidden in print) */}
        <div className="md:col-span-1 print:hidden">
          <GlassCard hoverEffect={false} className="p-5">
            <form onSubmit={handleAddItem} className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-850 pb-2">
                Quick Intake Item
              </h3>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eggs, Whole Milk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g. 1, 2 cans"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="glass-input rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                {/* Cost */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Est. Cost ($)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="glass-input rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-650"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-650"
                  >
                    {['Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Medicine', 'Other'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Shopping Item
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Right Panel: Grocery Checklist */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-850">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 hidden print:block">
              🛒 SMART KITCHEN GROCERY LIST
            </h3>
            
            {groceryList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                🍽️ Your grocery list is empty! Items used in details will recommend automatically.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {groceryList.map((item) => {
                  const priorityColor = 
                    item.priority === 'high' 
                      ? 'bg-red-500/10 text-red-500' 
                      : item.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500';

                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        item.checked 
                          ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900/60 opacity-60' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleGroceryItem(item.id)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4.5 h-4.5 print:w-4 print:h-4"
                        />
                        <div>
                          <span className={`text-xs font-bold ${
                            item.checked 
                              ? 'line-through text-slate-400' 
                              : 'text-slate-800 dark:text-slate-205'
                          }`}>
                            {item.name}
                          </span>
                          <div className="flex gap-2 mt-0.5 text-[9px] text-slate-400 font-semibold items-center">
                            <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" /> {item.category}</span>
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${priorityColor}`}>
                          {item.priority}
                        </span>
                        <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
                          ${item.estimatedCost.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteGroceryItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-all print:hidden"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
