import React, { useState, useMemo } from 'react';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  AlertCircle,
  Tag,
  MapPin,
  Clock
} from 'lucide-react';
import { Product } from '../types';

export const CalendarView: React.FC = () => {
  const { products } = usePantry();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const calendarCells = useMemo(() => {
    // First day of current month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Total cells to display (including leading buffer slots)
    const cells: (Date | null)[] = [];
    
    // Add null cells for previous month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }
    
    return cells;
  }, [currentDate, year, month]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get items expiring on a specific date string (YYYY-MM-DD)
  const getExpiriesForDate = (dateStr: string): Product[] => {
    return products.filter((p) => p.expiryDate === dateStr);
  };

  // Selected Date Info
  const selectedExpiries = useMemo(() => {
    return getExpiriesForDate(selectedDayStr);
  }, [products, selectedDayStr]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
          Smart Expiry Calendar
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Inspect upcoming expiry dates on a calendar grid and coordinate meal prep lists.
        </p>
      </div>

      {/* Grid Layout: Calendar Left, Day details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid Card */}
        <div className="lg:col-span-2">
          <GlassCard hoverEffect={false} className="p-5 md:p-6 flex flex-col h-full justify-between">
            <div>
              {/* Navigation Header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-brand-650" />
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-150">
                    {monthNames[month]} {year}
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-405 mb-3 uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Calendar cells grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const cellDateStr = cell.toISOString().split('T')[0];
                  const expiries = getExpiriesForDate(cellDateStr);
                  const isSelected = selectedDayStr === cellDateStr;
                  const dayNum = cell.getDate();

                  // Expiry color classification
                  let dotColor = '';
                  if (expiries.length > 0) {
                    const hasExpired = expiries.some(p => p.status === 'expired');
                    const hasExpiring = expiries.some(p => p.status === 'expiring');
                    dotColor = hasExpired 
                      ? 'bg-red-500 ring-2 ring-red-500/20' 
                      : hasExpiring 
                        ? 'bg-amber-500 ring-2 ring-amber-500/20' 
                        : 'bg-green-500 ring-2 ring-green-500/20';
                  }

                  return (
                    <button
                      key={`day-${cellDateStr}`}
                      onClick={() => setSelectedDayStr(cellDateStr)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative font-semibold text-xs transition-all border ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/20 scale-105'
                          : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{dayNum}</span>
                      
                      {/* Expiry indicator dot */}
                      {expiries.length > 0 && (
                        <span className={`absolute bottom-2.5 w-2 h-2 rounded-full ${
                          isSelected ? 'bg-white ring-0' : dotColor
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> EXPIRED ITEMS</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> EXPIRING SOON</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> FRESH STOCKS</span>
            </div>
          </GlassCard>
        </div>

        {/* Day Expiring details card panel */}
        <div className="lg:col-span-1">
          <GlassCard hoverEffect={false} className="h-full flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  Day Expirations
                </h3>
              </div>

              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-3">
                DATE: {selectedDayStr}
              </span>

              {selectedExpiries.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  🧘 No products expiring on this date!
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  {selectedExpiries.map((p) => {
                    const statusColor = 
                      p.status === 'expired' 
                        ? 'text-red-500' 
                        : p.status === 'expiring' 
                          ? 'text-amber-500' 
                          : 'text-green-500';

                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/product/${p.id}`)}
                        className="glass p-3 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between cursor-pointer hover:border-brand-500/40"
                      >
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-lg">🥛</div>
                          )}
                          <div>
                            <span className="font-bold text-xs text-slate-850 dark:text-slate-150 block truncate max-w-[130px]">{p.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{p.location}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${statusColor}`}>
                          {p.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl transition-all mt-4"
            >
              Back to Dashboard Grid
            </button>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
