import React, { useState } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  User as UserIcon, 
  Search, 
  CheckCheck,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { User, UserPreferences } from '../types';
import { AppNotification } from '../services/notificationService';

interface NavbarProps {
  user: User;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onOpenAuth: () => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  preferences,
  onUpdatePreferences,
  notifications,
  onMarkNotificationRead,
  onOpenAuth,
  onOpenMobileMenu,
  searchQuery,
  setSearchQuery,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    onUpdatePreferences({ ...preferences, theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E2E4E9] dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-7xl mx-auto">
        
        {/* Mobile Toggle & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button 
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-[#E2E4E9] dark:border-slate-700/60 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-teal-600 dark:focus:border-teal-500 focus:outline-none transition-all text-[#1A1C1E] dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={`Switch to ${preferences.theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {preferences.theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-500" />
                    Expiry Alerts
                  </h3>
                  <span className="text-xs text-slate-400">{unreadCount} unread</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">
                      No expiry alerts right now. All products look fresh! 🎉
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs transition-colors ${
                          n.read 
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500' 
                            : n.type === 'urgent'
                              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-xs leading-snug">{n.title}</h4>
                          {!n.read && (
                            <button 
                              onClick={() => onMarkNotificationRead(n.id)}
                              className="text-slate-400 hover:text-emerald-500"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed opacity-90">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Login */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {user.displayName || 'Guest User'}
              </span>
            </button>

            {/* Account dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {user.displayName || 'Guest User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  {user.isGuest && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      Guest Mode
                    </span>
                  )}
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.isGuest ? 'Sign In / Register' : 'Account Profile'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Switch Account / Reset</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
