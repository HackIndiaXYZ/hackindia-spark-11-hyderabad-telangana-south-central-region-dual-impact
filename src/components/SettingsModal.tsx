import React, { useState } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  DollarSign, 
  Globe, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { UserPreferences, User, Product } from '../types';

interface SettingsModalProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  user: User;
  products: Product[];
  onImportProducts: (products: Product[]) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  user,
  products,
  onImportProducts,
  onResetData,
}) => {
  const [theme, setTheme] = useState(preferences.theme);
  const [currency, setCurrency] = useState(preferences.currency || '$');
  const [browserNotifs, setBrowserNotifs] = useState(preferences.enableBrowserNotifications);
  const [dietary, setDietary] = useState(preferences.dietaryPreference || 'None');
  const [reminderDays, setReminderDays] = useState<number[]>(preferences.reminderDays || [7, 3, 2, 1, 0]);

  const handleSavePrefs = () => {
    onUpdatePreferences({
      ...preferences,
      theme,
      currency,
      enableBrowserNotifications: browserNotifs,
      dietaryPreference: dietary,
      reminderDays,
    });
    alert('Settings saved successfully!');
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const exportDataJSON = () => {
    const jsonStr = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_expiry_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const exportDataCSV = () => {
    const headers = ['Name', 'Brand', 'ExpiryDate', 'Category', 'Location', 'Quantity', 'Source'];
    const rows = products.map(p => [
      `"${p.name}"`,
      `"${p.brand || ''}"`,
      p.expiryDate,
      p.category,
      p.location,
      p.quantity,
      p.source
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_expiry_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            onImportProducts(imported);
            alert(`Successfully imported ${imported.length} products!`);
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            App Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500">Customize theme, alerts, currency, and data backups</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-8">
        
        {/* Theme & Regional */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Appearance & Currency
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Theme Mode
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Settings },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        theme === t.id
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
              >
                <option value="$">$ (USD)</option>
                <option value="₹">₹ (INR)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expiry Reminders */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Reminder Alerts & Schedule</span>
            <Bell className="w-4 h-4 text-emerald-500" />
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Browser & PWA Notifications
              </p>
              <p className="text-[11px] text-slate-400">
                Receive popup alerts before items expire
              </p>
            </div>
            <input
              type="checkbox"
              checked={browserNotifs}
              onChange={(e) => setBrowserNotifs(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Notify Me Days Before Expiry:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { day: 7, label: '7 Days Before' },
                { day: 3, label: '3 Days Before' },
                { day: 2, label: '2 Days Before' },
                { day: 1, label: '1 Day Before' },
                { day: 0, label: 'On Expiry Day' },
              ].map(item => {
                const isSelected = reminderDays.includes(item.day);
                return (
                  <button
                    key={item.day}
                    onClick={() => toggleReminderDay(item.day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <button
          onClick={handleSavePrefs}
          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>

        {/* Data Backup & Export */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Backup, Restore & Export
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={exportDataJSON}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={exportDataCSV}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-500" />
              <span>Export CSV File</span>
            </button>

            <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-purple-500" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Reset / Danger Zone */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset demo inventory data?')) {
                onResetData();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Inventory to Demo Data</span>
          </button>
        </div>

      </div>
    </div>
  );
};
