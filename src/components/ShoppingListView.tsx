import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  Share2, 
  Printer, 
  FileText, 
  Download, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Check, 
  RotateCcw,
  Tag,
  Store,
  Clock,
  ArrowUpDown,
  X,
  PackagePlus
} from 'lucide-react';
import { ShoppingItem, ProductCategory, PriorityLevel, Product } from '../types';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  products: Product[];
  currency?: string;
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'isPurchased'>) => void;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (id: string) => void;
  onTogglePurchased: (id: string) => void;
  onAddToPantryFromShopping?: (item: ShoppingItem) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  products,
  currency = '₹',
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onTogglePurchased,
  onAddToPantryFromShopping,
}) => {
  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Purchased'>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'date'>('priority');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Form states for manual add/edit
  const [formData, setFormData] = useState({
    name: '',
    category: 'Grocery' as ProductCategory,
    quantity: 1,
    unit: 'pcs',
    priority: 'Medium' as PriorityLevel,
    notes: '',
    expectedPrice: '',
    store: '',
  });

  const categories: ProductCategory[] = [
    'Dairy', 'Vegetables', 'Fruits', 'Medicine', 'Bakery', 'Snacks', 'Beverages', 'Frozen Food', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'
  ];

  // Smart AI Suggestions calculation based on pantry history
  const smartSuggestions = useMemo(() => {
    const existingNames = new Set(items.filter(i => !i.isPurchased).map(i => i.name.toLowerCase()));
    const suggestions: { name: string; category: ProductCategory; reason: string }[] = [];

    // Rule 1: Check products marked as used or expired
    const usedOrExpired = products.filter(p => p.isUsed || new Date(p.expiryDate) < new Date());
    usedOrExpired.forEach(p => {
      if (!existingNames.has(p.name.toLowerCase()) && suggestions.length < 5) {
        suggestions.push({
          name: p.name,
          category: p.category,
          reason: p.isUsed ? 'Finished in pantry recently' : 'Expired recently - needs replacement',
        });
        existingNames.add(p.name.toLowerCase());
      }
    });

    // Rule 2: Common weekly essentials if missing
    const essentials: { name: string; category: ProductCategory; reason: string }[] = [
      { name: 'Organic Milk', category: 'Dairy', reason: 'You usually buy Dairy every week' },
      { name: 'Fresh Eggs', category: 'Other', reason: 'Pantry essential restock' },
      { name: 'Whole Wheat Bread', category: 'Bakery', reason: 'Weekly bakery restock' },
      { name: 'Fresh Apples', category: 'Fruits', reason: 'Healthy fruit snack' },
    ];

    essentials.forEach(item => {
      if (!existingNames.has(item.name.toLowerCase()) && suggestions.length < 5) {
        suggestions.push(item);
        existingNames.add(item.name.toLowerCase());
      }
    });

    return suggestions;
  }, [products, items]);

  // Analytics calculation
  const pendingItems = items.filter(i => !i.isPurchased);
  const purchasedItems = items.filter(i => i.isPurchased);
  const estimatedCost = pendingItems.reduce((sum, item) => sum + (item.expectedPrice || 3.50) * item.quantity, 0);
  const purchasedCost = purchasedItems.reduce((sum, item) => sum + (item.expectedPrice || 3.50) * item.quantity, 0);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (item.store && item.store.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesPriority = selectedPriority === 'All' || item.priority === selectedPriority;
      const matchesStatus = statusFilter === 'All' 
        ? true 
        : statusFilter === 'Pending' ? !item.isPurchased : item.isPurchased;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, searchQuery, selectedCategory, selectedPriority, statusFilter, sortBy]);

  // Form Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Dairy',
      quantity: 1,
      unit: 'pcs',
      priority: 'Medium',
      notes: '',
      expectedPrice: '',
      store: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      priority: item.priority,
      notes: item.notes || '',
      expectedPrice: item.expectedPrice ? item.expectedPrice.toString() : '',
      store: item.store || '',
    });
    setShowAddModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      onUpdateItem(editingItem.id, {
        name: formData.name.trim(),
        category: formData.category,
        quantity: Math.max(1, formData.quantity),
        unit: formData.unit,
        priority: formData.priority,
        notes: formData.notes.trim() || undefined,
        expectedPrice: formData.expectedPrice ? parseFloat(formData.expectedPrice) : undefined,
        store: formData.store.trim() || undefined,
      });
    } else {
      onAddItem({
        name: formData.name.trim(),
        category: formData.category,
        quantity: Math.max(1, formData.quantity),
        unit: formData.unit,
        priority: formData.priority,
        notes: formData.notes.trim() || undefined,
        expectedPrice: formData.expectedPrice ? parseFloat(formData.expectedPrice) : undefined,
        store: formData.store.trim() || undefined,
        reason: 'Manual entry',
      });
    }

    setShowAddModal(false);
  };

  // Export & Share Handlers
  const handleShareList = () => {
    const listText = pendingItems.map(i => `• ${i.name} (${i.quantity} ${i.unit || ''}) [${i.priority} Priority]`).join('\n');
    const fullText = `🛒 Smart Expiry Shopping List (${pendingItems.length} items):\n\n${listText}`;

    if (navigator.share) {
      navigator.share({ title: 'My Shopping List', text: fullText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(fullText);
      alert('Shopping list copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Quantity', 'Priority', 'Status', 'Expected Price', 'Store', 'Notes'];
    const rows = items.map(i => [
      `"${i.name}"`,
      `"${i.category}"`,
      i.quantity,
      `"${i.priority}"`,
      i.isPurchased ? 'Purchased' : 'Pending',
      i.expectedPrice || '',
      `"${i.store || ''}"`,
      `"${i.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'smart_shopping_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#E2E4E9] dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
            Smart Auto-Restock
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E] dark:text-white">
            Smart Shopping List
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automatically restock finished or expired items, track priorities & estimated costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareList}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#E2E4E9] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#E2E4E9] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#E2E4E9] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E2E4E9] dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
            Pending Items
          </p>
          <h3 className="text-3xl font-bold text-[#1A1C1E] dark:text-white">
            {pendingItems.length}
          </h3>
          <div className="mt-2 text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
            {pendingItems.filter(i => i.priority === 'High').length} High Priority
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E2E4E9] dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
            Items Purchased
          </p>
          <h3 className="text-3xl font-bold text-[#1A1C1E] dark:text-white">
            {purchasedItems.length}
          </h3>
          <div className="mt-2 text-[11px] text-green-600 dark:text-green-400 font-semibold">
            {currency}{purchasedCost.toFixed(2)} spent
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E2E4E9] dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
            Estimated Cost
          </p>
          <h3 className="text-3xl font-bold text-[#1A1C1E] dark:text-white">
            {currency}{estimatedCost.toFixed(2)}
          </h3>
          <div className="mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            For {pendingItems.length} pending items
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E2E4E9] dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">
            Monthly Restock
          </p>
          <h3 className="text-3xl font-bold text-[#1A1C1E] dark:text-white">
            {items.length} Total
          </h3>
          <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
            Smart auto-suggestions active
          </div>
        </div>
      </div>

      {/* Smart Suggestions Banner */}
      {smartSuggestions.length > 0 && (
        <div className="p-5 rounded-3xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-sm mb-3">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>AI Smart Restock Suggestions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {smartSuggestions.map((sug, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-sm text-[#1A1C1E] dark:text-white line-clamp-1">
                      {sug.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      {sug.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    {sug.reason}
                  </p>
                </div>

                <button
                  onClick={() => onAddItem({
                    name: sug.name,
                    category: sug.category,
                    quantity: 1,
                    unit: 'pcs',
                    priority: 'Medium',
                    notes: `Smart suggestion: ${sug.reason}`,
                    reason: sug.reason,
                  })}
                  className="w-full py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to List</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Filters & Sorting */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E2E4E9] dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search shopping items, notes, store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {(['All', 'Pending', 'Purchased'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs w-full md:w-auto justify-end">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="priority">Priority (High first)</option>
              <option value="name">Item Name</option>
              <option value="date">Recently Added</option>
            </select>
          </div>

        </div>

        {/* Category & Priority Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E4E9] dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-bold shrink-0">Category:</span>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All
          </button>
          {['Dairy', 'Bakery', 'Vegetables', 'Fruits', 'Medicine', 'Snacks'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-slate-400 font-bold ml-auto shrink-0">Priority:</span>
          {['All', 'High', 'Medium', 'Low'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedPriority === p
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Shopping List Table / Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[#E2E4E9] dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center mx-auto mb-3 text-teal-600">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#1A1C1E] dark:text-white">
            No shopping items found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Add items manually or use AI Voice Assistant / Pantry auto-restock suggestions.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`
                p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4
                ${item.isPurchased 
                  ? 'bg-slate-50/80 dark:bg-slate-900/40 border-[#E2E4E9] dark:border-slate-800/60 opacity-70' 
                  : 'bg-white dark:bg-slate-900 border-[#E2E4E9] dark:border-slate-800 shadow-sm hover:shadow-md'
                }
              `}
            >
              {/* Left Column: Checkbox, Name, Category, Priority */}
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => onTogglePurchased(item.id)}
                  className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                    item.isPurchased
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-teal-600'
                  }`}
                >
                  {item.isPurchased && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-bold text-base ${item.isPurchased ? 'line-through text-slate-400' : 'text-[#1A1C1E] dark:text-white'}`}>
                      {item.name}
                    </span>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                      {item.category}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      item.priority === 'High'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : item.priority === 'Medium'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>

                  {/* Subtext: Store, Price, Notes, Reason */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                    {item.store && (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Store className="w-3 h-3 text-slate-400" />
                        {item.store}
                      </span>
                    )}
                    {item.expectedPrice && (
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {currency}{item.expectedPrice.toFixed(2)}
                      </span>
                    )}
                    {item.notes && (
                      <span>Note: {item.notes}</span>
                    )}
                    {item.reason && (
                      <span className="italic text-teal-700/80 dark:text-teal-400/80">({item.reason})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Pantry Restock & Action Buttons */}
              <div className="flex items-center gap-2 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E4E9] dark:border-slate-800">
                {item.isPurchased && onAddToPantryFromShopping && (
                  <button
                    onClick={() => onAddToPantryFromShopping(item)}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Add directly to Pantry Inventory"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Add to Pantry</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit item"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Shopping Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#E2E4E9] dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E4E9] dark:border-slate-800">
              <h3 className="font-bold text-lg text-[#1A1C1E] dark:text-white">
                {editingItem ? 'Edit Shopping Item' : 'Add Shopping Item'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Organic Milk, Eggs, Medicines..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity & Unit
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                    />
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pcs/kg/L"
                      className="w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Price ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.expectedPrice}
                    onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
                    placeholder="e.g. 4.50"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Store / Supermarket
                </label>
                <input
                  type="text"
                  value={formData.store}
                  onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                  placeholder="e.g. Whole Foods, Trader Joe's, Local Pharmacy"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Low fat, gluten free brand..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E2E4E9] dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#E2E4E9] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#E2E4E9] dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
