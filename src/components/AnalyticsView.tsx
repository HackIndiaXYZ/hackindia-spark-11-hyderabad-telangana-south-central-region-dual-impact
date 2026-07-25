import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  PieChart as PieIcon, 
  Award, 
  ShieldCheck 
} from 'lucide-react';
import { Product } from '../types';

interface AnalyticsViewProps {
  products: Product[];
  currency: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ products, currency }) => {
  const usedProducts = products.filter(p => p.isUsed);
  const activeProducts = products.filter(p => !p.isUsed);

  const moneySaved = usedProducts.reduce((acc, p) => acc + (p.price || 4) * (p.quantity || 1), 0);
  const moneyAtRisk = activeProducts.reduce((acc, p) => acc + (p.price || 4) * (p.quantity || 1), 0);

  // Category breakdown for Pie Chart
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });

  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    value: categoryMap[cat],
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

  // Monthly waste savings mock timeline
  const monthlySavingsData = [
    { month: 'Jan', saved: 24, wasted: 6 },
    { month: 'Feb', saved: 32, wasted: 4 },
    { month: 'Mar', saved: 45, wasted: 3 },
    { month: 'Apr', saved: 38, wasted: 5 },
    { month: 'May', saved: 52, wasted: 2 },
    { month: 'Jun', saved: 60, wasted: 1 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-100">Total Money Saved</span>
            <DollarSign className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{currency}{moneySaved.toFixed(2)}</p>
          <p className="text-xs text-emerald-100 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18% food waste reduction
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-100">Products Utilized</span>
            <CheckCircle2 className="w-5 h-5 text-purple-200" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{usedProducts.length} items</p>
          <p className="text-xs text-purple-100 mt-2">Consumed before expiry</p>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-100">Inventory Value</span>
            <ShieldCheck className="w-5 h-5 text-amber-200" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{currency}{moneyAtRisk.toFixed(2)}</p>
          <p className="text-xs text-amber-100 mt-2">Monitored active items</p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Waste Saved Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
            Monthly Waste vs Saved ({currency})
          </h3>
          <p className="text-xs text-slate-400 mb-6">Tracking food money saved versus items wasted</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySavingsData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="saved" stroke="#10b981" strokeWidth={3} name="Money Saved" />
                <Line type="monotone" dataKey="wasted" stroke="#f43f5e" strokeWidth={2} name="Wasted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-500" />
            Category Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-6">Breakdown of products by category</p>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) => entry.name}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Sustainable Impact Badge */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-base text-white">Sustainability Champion Badge 🏆</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              You have saved {usedProducts.length} products from landfill disposal this month.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-4 py-2 rounded-xl border border-emerald-800">
          Carbon Reduced: ~14.2 kg CO₂e
        </span>
      </div>

    </div>
  );
};
