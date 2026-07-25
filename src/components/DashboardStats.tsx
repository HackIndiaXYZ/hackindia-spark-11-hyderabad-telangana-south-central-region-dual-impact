import React from 'react';
import { Package, Clock, AlertTriangle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface DashboardStatsProps {
  total: number;
  fresh: number;
  expiringSoon: number;
  expired: number;
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  currency: string;
  moneySaved: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  total,
  fresh,
  expiringSoon,
  expired,
  selectedStatusFilter,
  onSelectStatusFilter,
  currency,
  moneySaved,
}) => {
  const cards = [
    {
      id: 'All',
      label: 'Total Products',
      count: total,
      subtext: fresh > 0 ? `${fresh} fresh items stored` : 'Inventory summary',
      icon: Package,
      borderClass: 'border-[#E2E4E9]',
      subtextClass: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'Fresh',
      label: 'Fresh Items',
      count: fresh,
      subtext: total > 0 ? `${Math.round((fresh / total) * 100) || 0}% of pantry fresh` : 'No items yet',
      icon: CheckCircle2,
      borderClass: 'border-[#E2E4E9]',
      subtextClass: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'Expiring Soon',
      label: 'Expiring Soon',
      count: expiringSoon,
      subtext: expiringSoon > 0 ? `${expiringSoon} items within 7 days` : '0 items expiring',
      icon: Clock,
      borderClass: 'border-[#E2E4E9] border-l-4 border-l-orange-400',
      subtextClass: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'Expired',
      label: 'Expired',
      count: expired,
      subtext: expired > 0 ? 'Requires attention' : 'Zero expired items',
      icon: AlertTriangle,
      borderClass: 'border-[#E2E4E9]',
      subtextClass: 'text-red-500 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedStatusFilter === card.id;

          return (
            <button
              key={card.id}
              onClick={() => onSelectStatusFilter(card.id)}
              className={`
                bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm text-left transition-all duration-200 group relative
                ${card.borderClass}
                ${isSelected 
                  ? 'ring-2 ring-teal-600 shadow-md scale-[1.01]' 
                  : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                  {card.label}
                </p>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-[#1A1C1E] dark:text-white tracking-tight">
                {card.count}
              </h3>
              
              <div className={`mt-2 text-[11px] font-semibold ${card.subtextClass}`}>
                {card.subtext}
              </div>

              {isSelected && (
                <span className="absolute top-2 right-2 text-[9px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Waste Saved Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40">
        <div className="flex items-center gap-2.5 text-xs text-teal-900 dark:text-teal-200">
          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Estimated Food Waste Saved: <strong className="font-bold text-teal-700 dark:text-teal-300">{currency}{moneySaved.toFixed(2)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-700/80 dark:text-teal-300/80">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>AI recipe suggestions utilize products before they spoil</span>
        </div>
      </div>
    </div>
  );
};
