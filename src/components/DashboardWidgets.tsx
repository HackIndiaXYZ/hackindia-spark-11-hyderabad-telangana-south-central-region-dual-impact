import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from './GlassCard';
import { 
  AlertTriangle, 
  Sparkles, 
  Trash2, 
  TrendingDown, 
  ShoppingCart, 
  Activity, 
  Pin,
  Flame,
  ArrowRight,
  Utensils,
  BrainCircuit,
  Heart
} from 'lucide-react';
import { Product, GroceryItem, ActivityLog } from '../types';

interface WidgetGridProps {
  onOpenScanner: () => void;
}

export const ExpiryWidget: React.FC = () => {
  const { products, markProductUsed, deleteProduct } = usePantry();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayExpires = products.filter((p) => p.expiryDate === todayStr);
  const tomorrowExpires = products.filter((p) => p.expiryDate === tomorrowStr);
  
  const hasAlerts = todayExpires.length > 0 || tomorrowExpires.length > 0;

  return (
    <GlassCard className="col-span-1 md:col-span-2">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Expiry Alert Center</h3>
        </div>
        <button 
          onClick={() => navigate('/pantry')} 
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
        >
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {!hasAlerts ? (
        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          🎉 No items expiring today or tomorrow. Your foods are fresh!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Expiring Today */}
          {todayExpires.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                {p.imageUrl ? (
                  <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950 text-red-500 flex items-center justify-center font-bold text-xs">⚠️</div>
                )}
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-150 block">{p.name}</span>
                  <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Expires Today!</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => markProductUsed(p.id)}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                >
                  Mark Used
                </button>
                <button 
                  onClick={() => deleteProduct(p.id)}
                  className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Expiring Tomorrow */}
          {tomorrowExpires.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                {p.imageUrl ? (
                  <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-500 flex items-center justify-center font-bold text-xs">🥛</div>
                )}
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-150 block">{p.name}</span>
                  <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Expires Tomorrow</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => markProductUsed(p.id)}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                >
                  Mark Used
                </button>
                <button 
                  onClick={() => deleteProduct(p.id)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export const WastePredictorWidget: React.FC = () => {
  const { products } = usePantry();
  
  // Calculate Waste Risk Score
  // Logic: score goes up if items are expiring or expired.
  const expiredCount = products.filter((p) => p.status === 'expired').length;
  const expiringCount = products.filter((p) => p.status === 'expiring').length;
  const total = products.length || 1;
  
  const rawScore = Math.max(0, 100 - (expiredCount * 15 + expiringCount * 5));
  const score = Math.round(rawScore);
  
  let rating = 'Low Risk';
  let color = 'text-green-600 dark:text-green-400';
  let bgColor = 'bg-green-500/10';
  
  if (score < 60) {
    rating = 'High Waste Risk';
    color = 'text-red-600 dark:text-red-400';
    bgColor = 'bg-red-500/10';
  } else if (score < 85) {
    rating = 'Medium Risk';
    color = 'text-amber-600 dark:text-amber-400';
    bgColor = 'bg-amber-500/10';
  }

  // Calculate potential money to waste (MRP of expiring + expired items)
  const moneyAtRisk = products
    .filter((p) => p.status === 'expired' || p.status === 'expiring')
    .reduce((sum, p) => sum + (p.mrp || 3.99), 0);

  return (
    <GlassCard>
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <BrainCircuit className="w-5 h-5 text-violet-500" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Waste Predictor AI</h3>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Rating</span>
          <span className={`text-base font-bold ${color}`}>{rating}</span>
        </div>
        <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center font-bold text-sm ${color}`}>
          {score}
        </div>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            score > 85 ? 'bg-green-500' : score > 60 ? 'bg-amber-500' : 'bg-red-500'
          }`} 
          style={{ width: `${score}%` }} 
        />
      </div>

      <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Projected Waste</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">${moneyAtRisk.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Monthly Savings</span>
          <span className="font-bold text-green-500 flex items-center gap-0.5 justify-end">
            <TrendingDown className="w-3.5 h-3.5" /> $42.50
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

export const SuggestedRecipeWidget: React.FC = () => {
  const { products } = usePantry();
  const navigate = useNavigate();

  // Find expiring items to recommend
  const expiring = products.filter(p => p.status === 'expiring').map(p => p.name);
  
  return (
    <GlassCard className="flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <Utensils className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Meal Suggestion</h3>
        </div>

        <div className="bg-brand-500/5 border border-brand-500/10 p-3 rounded-xl mb-4">
          <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">Chef AI recommends:</span>
          <p className="font-bold text-xs text-slate-850 dark:text-slate-100 my-1">
            {expiring.includes('Organic Whole Milk') && expiring.includes('Fresh Strawberries')
              ? '🍓 Creamy Strawberry Milkshake'
              : '🥗 Smart Stir-Fry Delight'}
          </p>
          <p className="text-[10px] text-slate-500 leading-normal">
            Uses your expiring {expiring.slice(0,2).join(' and ') || 'inventory veggies'}.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/recipes')}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/10"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Generate Recipe Now
      </button>
    </GlassCard>
  );
};

export const HealthTipWidget: React.FC = () => {
  const { settings } = usePantry();
  
  // Health tips database by health mode
  const tips: { [key: string]: string } = {
    Standard: 'Drink at least 8 glasses of water today. It keeps metabolism running fast.',
    Diabetic: 'Focus on low-glycemic foods. Combine complex carbs with protein to avoid sugar spikes.',
    'Weight Loss': 'Try eating from smaller plates today; studies show it reduces caloric intake by 15%.',
    'Gym / High Protein': 'Consume 20-30g of protein within 45 minutes after workout for optimal muscle repair.',
    'Heart Healthy': 'Reduce salt intake and choose olive oil or avocados to secure healthy HDL fatty acids.',
    Vegetarian: 'Combine lentils with grains to form a complete amino acid protein chain.',
    Vegan: 'Ensure your daily vitamin B-12 supplement is taken. Leafy greens are rich in calcium.'
  };

  const currentTip = tips[settings.healthMode] || tips.Standard;

  return (
    <GlassCard>
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <Heart className="w-5 h-5 text-red-500" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Health Advisor ({settings.healthMode})
        </h3>
      </div>
      
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Health Tip</span>
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium mt-0.5">
            "{currentTip}"
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

export const ShoppingReminderWidget: React.FC = () => {
  const { groceryList, toggleGroceryItem } = usePantry();
  const navigate = useNavigate();

  const activeItems = groceryList.filter((g) => !g.checked).slice(0, 3);

  return (
    <GlassCard>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Shopping List</h3>
        </div>
        <button 
          onClick={() => navigate('/groceries')} 
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
        >
          Go to List <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {activeItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          🛒 Shopping list is empty. Auto-replenish is monitoring!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activeItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleGroceryItem(item.id)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                />
                <span className="text-xs font-semibold text-slate-750 dark:text-slate-250">
                  {item.name}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                Qty: {item.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export const ActivityLogWidget: React.FC = () => {
  const { activityLogs } = usePantry();

  const logsToShow = activityLogs.slice(0, 4);

  const actionEmoji: { [key: string]: string } = {
    added: '➕',
    used: '✅',
    expired: '🗑️',
    moved: '📦',
    opened: '🔓',
  };

  const actionText: { [key: string]: string } = {
    added: 'added',
    used: 'consumed',
    expired: 'discarded',
    moved: 'relocated',
    opened: 'opened',
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <Activity className="w-5 h-5 text-brand-500" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Recent Activity Feed</h3>
      </div>

      {logsToShow.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          No family activity logged yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logsToShow.map((log) => {
            const timeAgo = Math.round((Date.now() - log.timestamp) / 60000);
            const timeString = timeAgo < 1 ? 'Just now' : timeAgo === 1 ? '1m ago' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo/60)}h ago`;
            
            return (
              <div key={log.id} className="flex justify-between items-start text-xs border-b border-slate-100 dark:border-slate-800/40 pb-2.5 last:border-0 last:pb-0">
                <div className="flex gap-2">
                  <span className="shrink-0">{actionEmoji[log.action] || '📌'}</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {log.userName} {actionText[log.action] || 'modified'} **{log.productName}**
                    </p>
                    {log.details && (
                      <span className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">
                        {log.details}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase shrink-0">
                  {timeString}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export const PinnedWidget: React.FC = () => {
  const { products, togglePinProduct } = usePantry();
  const navigate = useNavigate();

  const pinnedItems = products.filter((p) => p.pinned);

  return (
    <GlassCard className="col-span-1 md:col-span-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-indigo-500 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Pinned Products</h3>
        </div>
        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
          {pinnedItems.length} Pinned
        </span>
      </div>

      {pinnedItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
          📌 Pin products from the details view to keep them floating here for fast checking.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {pinnedItems.map((p) => {
            const expDate = new Date(p.expiryDate);
            const today = new Date();
            today.setHours(0,0,0,0);
            const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            return (
              <div 
                key={p.id} 
                onClick={() => navigate(`/product/${p.id}`)}
                className="group relative cursor-pointer glass hover:border-brand-500/50 p-4 rounded-xl flex flex-col gap-3 transition-all"
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} className="w-full h-24 object-cover rounded-lg" alt="" />
                ) : (
                  <div className="w-full h-24 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-xl">🥛</div>
                )}
                <div>
                  <h4 className="font-bold text-xs text-slate-850 dark:text-slate-150 truncate">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 truncate">
                    {p.brand} ({p.location})
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`font-bold uppercase ${
                    daysLeft < 0 ? 'text-red-500' : daysLeft <= 2 ? 'text-amber-500' : 'text-green-500'
                  }`}>
                    {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft} days`}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinProduct(p.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500"
                    title="Unpin"
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
