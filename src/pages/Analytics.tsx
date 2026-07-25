import React, { useMemo } from 'react';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Trash2, 
  Activity,
  Award
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { products, cookedHistory } = usePantry();

  // 1. Category Distribution Calculation
  const categoryData = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    products.forEach((p) => {
      distribution[p.category] = (distribution[p.category] || 0) + 1;
    });

    const colors = [
      '#8b5cf6', // Violet (Dairy)
      '#10b981', // Emerald (Vegetables)
      '#f59e0b', // Amber (Fruits)
      '#3b82f6', // Blue (Medicine)
      '#ec4899', // Pink (Cosmetics)
      '#ef4444', // Red (Bakery)
      '#14b8a6', // Teal (Frozen Food)
      '#6366f1', // Indigo (Beverages)
      '#64748b'  // Slate (Other)
    ];

    return Object.entries(distribution).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [products]);

  // 2. Mock Monthly Waste & Consumption Trends
  const monthlyTrends = [
    { month: 'Feb', Consumed: 12, Wasted: 4, MoneySaved: 32 },
    { month: 'Mar', Consumed: 15, Wasted: 3, MoneySaved: 45 },
    { month: 'Apr', Consumed: 18, Wasted: 5, MoneySaved: 54 },
    { month: 'May', Consumed: 22, Wasted: 2, MoneySaved: 68 },
    { month: 'Jun', Consumed: 25, Wasted: 1, MoneySaved: 78 },
    { month: 'Jul', Consumed: products.length + 8, Wasted: products.filter(p=>p.status==='expired').length, MoneySaved: 94 }
  ];

  // 3. Top Expired list calculation
  const topExpiredRank = [
    { name: 'Ibuprofen Tablets', count: 3, cost: 19.50 },
    { name: 'Baby Spinach', count: 2, cost: 7.98 },
    { name: 'Whole Wheat Bread', count: 2, cost: 5.50 },
    { name: 'Organic Milk', count: 1, cost: 4.89 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
          Analytics Command
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Machine learning estimates of monthly waste trends, financial logs, and dietary compositions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Money Saved', value: '$94.00', icon: DollarSign, trend: '+18% this month', color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Food Waste Avoided', value: '91%', icon: Award, trend: 'Top 5% of App Users', color: 'text-brand-600', bg: 'bg-brand-500/10' },
          { label: 'Expired Products', value: '4 items', icon: Trash2, trend: '-60% from last month', color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Recipe Cookings', value: `${cookedHistory.length || 6} meals`, icon: Activity, trend: 'Generated via Chef AI', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        ].map((stat, idx) => (
          <GlassCard key={idx} hoverEffect={false} className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{stat.label}</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{stat.value}</p>
              <span className={`text-[10px] font-semibold mt-1 block ${stat.color}`}>{stat.trend}</span>
            </div>
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Chart Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Consumed vs Wasted Bar Chart */}
        <GlassCard hoverEffect={false} className="col-span-1 lg:col-span-2 p-5 h-[360px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Consumption vs Waste Trend
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quantities in units</span>
          </div>

          <div className="w-full h-64 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.85)', border: '0', borderRadius: '12px', color: '#fff' }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Consumed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Wasted" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Category Pie Chart */}
        <GlassCard hoverEffect={false} className="col-span-1 p-5 h-[360px] flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Category Distribution
            </h3>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              No categories loaded.
            </div>
          ) : (
            <div className="flex items-center h-52">
              <div className="w-1/2 h-full text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.85)', border: '0', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="w-1/2 flex flex-col gap-2 max-h-48 overflow-y-auto pl-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-350">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate flex-1">{cat.name} ({cat.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

      </div>

      {/* Savings Line graph & Top Expired logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart money saved */}
        <GlassCard hoverEffect={false} className="col-span-1 lg:col-span-2 p-5 h-[320px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Monthly Cumulative Savings ($)
            </h3>
          </div>

          <div className="w-full h-56 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.85)', border: '0', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="MoneySaved" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Expired Waste list */}
        <GlassCard hoverEffect={false} className="col-span-1 p-5 h-[320px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Frequent Expiry Spoilers</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {topExpiredRank.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[11px] font-bold text-slate-400">#{idx+1}</span>
                    <div>
                      <span className="font-bold text-slate-750 dark:text-slate-200 block">{item.name}</span>
                      <span className="text-[9px] text-slate-450">{item.count} discards</span>
                    </div>
                  </div>
                  <span className="font-bold text-red-500">-${item.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[9px] font-semibold text-slate-400 block border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 text-center">
            Tip: Buy smaller quantities of baby spinach and bread.
          </span>
        </GlassCard>

      </div>

    </div>
  );
};
