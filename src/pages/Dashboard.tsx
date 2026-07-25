import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ExpiryWidget, 
  WastePredictorWidget, 
  SuggestedRecipeWidget, 
  HealthTipWidget, 
  ShoppingReminderWidget, 
  ActivityLogWidget, 
  PinnedWidget 
} from '../components/DashboardWidgets';
import { 
  Search, 
  Filter, 
  Plus, 
  Grid, 
  List, 
  ChevronDown, 
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Eye,
  Check,
  MapPin,
  Tag
} from 'lucide-react';
import { Product, ProductCategory, PantryLocation } from '../types';

export const Dashboard: React.FC = () => {
  const { products, markProductUsed } = usePantry();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('expiry'); // expiry, name, quantity
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Stat calculations
  const stats = useMemo(() => {
    const total = products.length;
    const fresh = products.filter((p) => p.status === 'fresh').length;
    const expiring = products.filter((p) => p.status === 'expiring').length;
    const expired = products.filter((p) => p.status === 'expired').length;
    return { total, fresh, expiring, expired };
  }, [products]);

  // Daily AI summary
  const dailySummary = useMemo(() => {
    const expiringSoon = products.filter((p) => p.status === 'expiring');
    if (expiringSoon.length === 0) {
      return "✨ Good morning Varshita! Your kitchen is in optimal shape. All ingredients are fresh, and waste risk is extremely low.";
    }
    const names = expiringSoon.map(p => p.name).slice(0, 2).join(', ');
    return `🥛 Good morning Varshita! You have ${expiringSoon.length} items expiring soon (including ${names}). Chef AI suggests generating a custom meal recipe to consume them today.`;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.barcode && p.barcode.includes(searchQuery));
        
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesLocation = selectedLocation === 'All' || p.location === selectedLocation;
        const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry') {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'quantity') {
          return b.quantity - a.quantity;
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedLocation, selectedStatus, sortBy]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const getDaysLeft = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            AI-powered expiry scanning and waste management coordinator.
          </p>
        </div>
        <button
          onClick={() => navigate('/add-product')}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Product Manual
        </button>
      </div>

      {/* AI Daily Summary Greeting Card */}
      <GlassCard hoverEffect={false} className="bg-gradient-to-r from-brand-600/5 to-indigo-600/5 border border-brand-500/15 p-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-650 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block tracking-wider">AI Morning Insight</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed mt-0.5">
              {dailySummary}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total items', count: stats.total, color: 'text-indigo-650 dark:text-indigo-400', bg: 'bg-indigo-500/10', icon: HelpCircle },
          { label: 'Fresh products', count: stats.fresh, color: 'text-green-650 dark:text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
          { label: 'Expiring soon', count: stats.expiring, color: 'text-amber-650 dark:text-amber-400', bg: 'bg-amber-500/10', icon: AlertCircle },
          { label: 'Expired items', count: stats.expired, color: 'text-red-650 dark:text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
        ].map((item, idx) => (
          <GlassCard key={idx} hoverEffect={true} className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-450 dark:text-slate-450 uppercase font-bold tracking-wider">{item.label}</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{item.count}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
              <item.icon className="w-6 h-6" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Widgets Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ExpiryWidget />
        <WastePredictorWidget />
        
        <SuggestedRecipeWidget />
        <HealthTipWidget />
        <ShoppingReminderWidget />
        
        <PinnedWidget />
        <ActivityLogWidget />
      </div>

      {/* Inventory Filtering and Products Table */}
      <div className="flex flex-col gap-6 mt-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Kitchen Inventory Details
        </h2>

        {/* Filter Bar */}
        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search by name, brand, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Selector Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Category Select */}
            <div className="flex flex-col">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="glass-input rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350"
              >
                <option value="All">All Categories</option>
                {['Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location Select */}
            <div className="flex flex-col">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="glass-input rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350"
              >
                <option value="All">All Storage</option>
                {['Pantry', 'Refrigerator', 'Freezer', 'Medicine Cabinet', 'Bathroom', 'Kitchen Shelf'].map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="flex flex-col">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="glass-input rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350"
              >
                <option value="All">All Status</option>
                <option value="fresh">Fresh</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex flex-col">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass-input rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350"
              >
                <option value="expiry">Sort: Expiry Date</option>
                <option value="name">Sort: A-Z Alphabet</option>
                <option value="quantity">Sort: Quantity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="glass p-12 rounded-3xl border border-slate-200 dark:border-slate-850 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-2xl">🍽️</div>
            <div>
              <p className="font-bold text-slate-850 dark:text-slate-200">No products match your filters</p>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">Try resetting the drop-downs or add a new food item.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((p) => {
                const daysLeft = getDaysLeft(p.expiryDate);
                const statusColor = 
                  p.status === 'expired' 
                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                    : p.status === 'expiring' 
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                      : 'bg-green-500/10 text-green-500 border-green-500/20';

                return (
                  <GlassCard
                    key={p.id}
                    hoverEffect={true}
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="flex flex-col justify-between h-[360px] cursor-pointer"
                  >
                    {/* Header Image & Info */}
                    <div className="flex flex-col gap-3.5">
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🥛</div>
                        )}
                        <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor} backdrop-blur`}>
                          {p.status}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                          <Tag className="w-3.5 h-3.5 text-slate-450" />
                          <span>{p.category}</span>
                          <span>•</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-450" />
                          <span>{p.location}</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-850 dark:text-slate-150 truncate mt-1">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold truncate">
                          {p.brand}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Timeline Expiry Display */}
                    <div className="flex flex-col gap-3.5 mt-4">
                      {/* Timeline Bar indicator */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            daysLeft < 0 ? 'bg-red-500' : daysLeft <= 2 ? 'bg-amber-500' : 'bg-green-500'
                          }`} 
                          style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 10) * 100))}%` }} 
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">EXPIRY DATE</span>
                          <span className="font-bold text-slate-850 dark:text-slate-200">
                            {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft} days left`}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markProductUsed(p.id);
                            }}
                            className="p-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                            title="Mark Consumed"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${p.id}`);
                            }}
                            className="p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </GlassCard>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
