import React from 'react';
import { 
  LayoutDashboard, 
  Scan, 
  PlusCircle, 
  ShoppingBag,
  UtensilsCrossed, 
  MessageSquareCode, 
  BarChart3, 
  Settings, 
  Sparkles,
  Mic
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'scan' 
  | 'manual' 
  | 'shopping'
  | 'recipes' 
  | 'chat' 
  | 'analytics' 
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  expiringSoonCount: number;
  shoppingPendingCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  expiringSoonCount,
  shoppingPendingCount = 0,
  isOpenMobile,
  onCloseMobile,
  onOpenVoiceAssistant,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan Product', icon: Scan, badge: 'AI OCR' },
    { id: 'manual', label: 'Add Product', icon: PlusCircle },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingBag, badge: shoppingPendingCount > 0 ? `${shoppingPendingCount}` : undefined },
    { id: 'recipes', label: 'AI Recipe Chef', icon: UtensilsCrossed, badge: expiringSoonCount > 0 ? `${expiringSoonCount} Ready` : undefined },
    { id: 'chat', label: 'AI Recipe Chat', icon: MessageSquareCode },
    { id: 'analytics', label: 'Analytics & Waste', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-[#E2E4E9] dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col
      ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="flex flex-col h-full p-4">
        {/* Brand Header */}
        <div className="p-2 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            Σ
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-[#1A1C1E] dark:text-white block leading-snug">
              SmartExpiry AI
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              Pantry & Inventory
            </span>
          </div>
        </div>

        {/* Menu Label */}
        <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Navigation
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' 
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60 hover:text-slate-800'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`
                    text-[10px] font-bold px-2 py-0.5 rounded-full
                    ${isActive 
                      ? 'bg-teal-200/60 text-teal-800 dark:bg-teal-800 dark:text-teal-100' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Assistant Banner & Voice Trigger at Bottom */}
        <div className="mt-auto pt-3 border-t border-[#E2E4E9] dark:border-slate-800 space-y-3">
          <button
            onClick={onOpenVoiceAssistant}
            className="w-full p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Voice Assistant</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              Live
            </span>
          </button>

          <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-100/80 dark:border-teal-900/40">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>AI Vision & Restock</span>
            </div>
            <p className="text-[11px] text-teal-700/80 dark:text-teal-400 leading-relaxed">
              Auto-restock, OCR recognition & voice commands.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
