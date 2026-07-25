import React, { useState } from 'react';
import { usePantry } from '../context/PantryContext';
import { GlassCard } from '../components/GlassCard';
import { useNavigate } from 'react-router-dom';
import { 
  Refrigerator, 
  Archive, 
  FlameKindling, 
  HeartHandshake, 
  Bath, 
  Grid3X3,
  MoveRight,
  ArrowUpDown,
  Tag,
  ArrowRight,
  Trash2,
  Calendar
} from 'lucide-react';
import { PantryLocation, Product } from '../types';

export const DigitalPantry: React.FC = () => {
  const { products, updateProduct, deleteProduct } = usePantry();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<PantryLocation>('Refrigerator');

  const locations: { label: PantryLocation; icon: any; desc: string }[] = [
    { label: 'Refrigerator', icon: Refrigerator, desc: 'Chilled items, dairy, opened packages, fresh salads' },
    { label: 'Freezer', icon: FlameKindling, desc: 'Frozen meats, vegetables, ice-creams, long-term storage' },
    { label: 'Pantry', icon: Archive, desc: 'Dry foods, grains, spices, cans, unopened supplies' },
    { label: 'Medicine Cabinet', icon: HeartHandshake, desc: 'First-aid, prescription pills, multivitamins, syrups' },
    { label: 'Bathroom', icon: Bath, desc: 'Cosmetics, skin care creams, soaps, body washes' },
    { label: 'Kitchen Shelf', icon: Grid3X3, desc: 'Everyday spices, oils, bread, snacks kept at room temperature' },
  ];

  // Group products by location
  const productsByLocation = (loc: PantryLocation): Product[] => {
    return products.filter((p) => p.location === loc);
  };

  const handleMoveProduct = (productId: string, newLoc: PantryLocation) => {
    updateProduct(productId, { location: newLoc });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
          Digital Pantry Locations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Manage product inventory sorted by physical storage shelves. Move items between locations.
        </p>
      </div>

      {/* Grid of Locations (Cabinet Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((loc) => {
          const items = productsByLocation(loc.label);
          const expiringCount = items.filter((i) => i.status === 'expiring').length;
          const expiredCount = items.filter((i) => i.status === 'expired').length;
          const isActive = selectedLocation === loc.label;

          return (
            <GlassCard
              key={loc.label}
              onClick={() => setSelectedLocation(loc.label)}
              hoverEffect={true}
              className={`p-6 flex flex-col justify-between min-h-[170px] border-2 cursor-pointer transition-all duration-300 ${
                isActive 
                  ? 'border-brand-500/50 bg-brand-500/5 shadow-brand-500/5' 
                  : 'border-white/20 dark:border-white/5'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-900 text-slate-650'
                  }`}>
                    <loc.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex gap-1.5">
                    {expiredCount > 0 && (
                      <span className="text-[9px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                        {expiredCount} Expired
                      </span>
                    )}
                    {expiringCount > 0 && (
                      <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {expiringCount} Alert
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150">
                  {loc.label}
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-normal">
                  {loc.desc}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-4">
                <span>{items.length} PRODUCTS</span>
                <span className="text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                  Open Shelf <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Expanded Shelf Detail Section */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
              {React.createElement(locations.find(l => l.label === selectedLocation)?.icon || Archive, { className: 'w-5 h-5' })}
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
              Inside: {selectedLocation}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {productsByLocation(selectedLocation).length} active items
          </span>
        </div>

        {productsByLocation(selectedLocation).length === 0 ? (
          <div className="glass p-12 rounded-3xl border border-slate-200 dark:border-slate-850 text-center flex flex-col items-center justify-center gap-3">
            <p className="font-bold text-slate-600 dark:text-slate-400">This shelf is currently empty</p>
            <p className="text-xs text-slate-450">Scanned items can be configured to sit in this location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productsByLocation(selectedLocation).map((p) => {
              const expDate = new Date(p.expiryDate);
              const today = new Date();
              today.setHours(0,0,0,0);
              const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
              
              const statusColor = 
                p.status === 'expired' 
                  ? 'bg-red-500/10 text-red-500' 
                  : p.status === 'expiring' 
                    ? 'bg-amber-500/10 text-amber-500' 
                    : 'bg-green-500/10 text-green-500';

              return (
                <div key={p.id} className="glass p-4 rounded-2xl border border-slate-200 dark:border-slate-850 flex items-center justify-between gap-4">
                  
                  {/* Left product info */}
                  <div 
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xl">🥛</div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">
                        {p.name}
                      </span>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold truncate flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {p.brand} ({p.category})
                      </p>
                    </div>
                  </div>

                  {/* Expiry Pill */}
                  <div className="text-right flex items-center gap-4 shrink-0">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                        {p.status}
                      </span>
                      <span className="text-[10px] block font-bold text-slate-500 mt-1 uppercase">
                        {days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days} days left`}
                      </span>
                    </div>

                    {/* Quick Move Action Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">MOVE:</span>
                      <select
                        value={p.location}
                        onChange={(e) => handleMoveProduct(p.id, e.target.value as PantryLocation)}
                        className="glass-input rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500"
                      >
                        {locations.map((loc) => (
                          <option key={loc.label} value={loc.label}>
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
