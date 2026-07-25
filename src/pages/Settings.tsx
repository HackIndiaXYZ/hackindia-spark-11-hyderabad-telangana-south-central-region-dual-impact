import React, { useState } from 'react';
import { usePantry } from '../context/PantryContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Sparkles, 
  Database, 
  Users, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  Lock, 
  Languages, 
  Check,
  Plus
} from 'lucide-react';
import { HealthMode } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, exportData, importData } = usePantry();
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfileName } = useAuth();

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  // Gemini API Key state
  const [geminiKey, setGeminiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  // Family Invite state
  const [inviteName, setInviteName] = useState('');

  // Notification reminder state selection
  const reminderOptions = [
    { value: 7, label: '7 days before' },
    { value: 3, label: '3 days before' },
    { value: 2, label: '2 days before' },
    { value: 1, label: '1 day before' },
    { value: 0, label: 'On expiry day' },
  ];

  const handleToggleReminderDay = (day: number) => {
    const active = settings.reminderDays;
    let updated: number[];
    if (active.includes(day)) {
      updated = active.filter(d => d !== day);
    } else {
      updated = [...active, day].sort((a, b) => b - a);
    }
    updateSettings({ reminderDays: updated });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileName(displayName);
    alert('👤 User profile name updated successfully!');
  };

  const handleSaveGeminiKey = () => {
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    alert('✨ Gemini API Key saved locally. AI recipes and OCR visual scans are now active!');
  };

  const handleInviteFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    const updated = [...settings.familyMembers, inviteName.trim()];
    updateSettings({ familyMembers: updated });
    setInviteName('');
    alert(`🎉 Invited ${inviteName} to join your pantry!`);
  };

  const handleExportBackup = () => {
    const jsonStr = exportData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `smart_kitchen_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          const success = importData(text);
          if (success) {
            alert('📦 Backup restored successfully! Refreshing details.');
            window.location.reload();
          } else {
            alert('❌ Failed to parse backup file. Please ensure it is a valid Smart Kitchen backup JSON.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteAllData = () => {
    if (confirm('⚠️ WARNING: This will permanently delete all your products, settings, grocery list, and chat logs from this browser. This cannot be undone. Proceed?')) {
      localStorage.clear();
      alert('Waste logs and inventory deleted. Reloading App.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
          System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Configure notification reminders, integrate AI developer credentials, download local backups, and manage family invites.
        </p>
      </div>

      {/* Main Settings Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Navigation-like panels */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* User Profile settings */}
          <GlassCard hoverEffect={false} className="p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <User className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">User Account Profile</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="flex gap-4 items-end">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Profile Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="bg-brand-500/10 hover:bg-brand-500/15 text-brand-650 dark:text-brand-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all shrink-0 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Update Name
              </button>
            </form>
          </GlassCard>

          {/* Gemini AI Credentials Integration */}
          <GlassCard hoverEffect={false} className="p-6 border border-brand-500/15">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Sparkles className="w-5 h-5 text-brand-650" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Gemini AI Credentials</h3>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
              To trigger real live vision OCR scanning, cooking chatbot questions, and customized recipe generation, input your personal **Gemini API Key** below. This key is saved strictly inside your local browser storage.
            </p>

            <div className="flex gap-4 items-end">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Gemini API Key</label>
                <input
                  type="password"
                  placeholder={geminiKey ? "••••••••••••••••••••••••" : "Paste your AI key here..."}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-brand-500/10"
              >
                <Check className="w-4 h-4" />
                Save Key
              </button>
            </div>
          </GlassCard>

          {/* Notification Threshold Timings */}
          <GlassCard hoverEffect={false} className="p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Bell className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Alert Reminder Intervals</h3>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal mb-4">
              Select what time buffers should trigger browser notifications to alert you about spoiling food products.
            </p>

            <div className="flex flex-col gap-2.5">
              {reminderOptions.map((opt) => {
                const isChecked = settings.reminderDays.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleReminderDay(opt.value)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </GlassCard>

          {/* Backup Restore Database */}
          <GlassCard hoverEffect={false} className="p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Database className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Database Portability Backups</h3>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Export */}
              <button
                onClick={handleExportBackup}
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export JSON Backup
              </button>

              {/* Import */}
              <label className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center select-none">
                <Upload className="w-4 h-4" />
                Restore Backup
                <input
                  type="file"
                  onChange={handleImportBackup}
                  accept=".json"
                  className="hidden"
                />
              </label>
            </div>
          </GlassCard>

        </div>

        {/* Right Side: Family Sharing & Danger Actions */}
        <div className="flex flex-col gap-6">
          
          {/* Family Invites list */}
          <GlassCard hoverEffect={false}>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Users className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Family Kitchen Sharing</h3>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
              Simulate sharing your pantry with other family members. Added items will sync and log to the activities list.
            </p>

            <div className="flex flex-col gap-2.5 mb-4 max-h-40 overflow-y-auto pr-1">
              {settings.familyMembers.map((member) => (
                <div key={member} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="font-semibold text-slate-750 dark:text-slate-200">{member}</span>
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Member
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleInviteFamily} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Invite name..."
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs font-semibold"
              />
              <button
                type="submit"
                className="bg-indigo-500 text-white p-2 rounded-xl shadow-md hover:bg-indigo-650"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </form>
          </GlassCard>

          {/* Theme Settings Panel */}
          <GlassCard hoverEffect={false}>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Languages className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Preferences</h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Light/Dark Toggle */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-650 dark:text-slate-350">Application Theme</span>
                <button
                  onClick={toggleTheme}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-250 dark:border-slate-850"
                >
                  Theme: {theme}
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-650 dark:text-slate-350">Language</span>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  className="glass-input rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-550"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Danger zone */}
          <GlassCard hoverEffect={false} className="border border-red-500/15">
            <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-850/80 pb-3 mb-4 text-red-500">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-extrabold text-sm">Danger Zone</h3>
            </div>

            <button
              onClick={handleDeleteAllData}
              className="w-full bg-red-500 hover:bg-red-650 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Reset App Data Cache
            </button>
          </GlassCard>

        </div>

      </div>

    </div>
  );
};
