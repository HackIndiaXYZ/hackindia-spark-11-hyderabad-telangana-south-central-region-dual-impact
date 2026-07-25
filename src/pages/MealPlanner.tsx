import React, { useState } from 'react';
import { usePantry } from '../context/PantryContext';
import { generateDailyMealPlan } from '../services/gemini';
import { GlassCard } from '../components/GlassCard';
import { RecipeCompanion } from '../components/RecipeCompanion';
import { 
  Sparkles, 
  Utensils, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Flame, 
  Heart, 
  Clock, 
  ShoppingBag,
  HeartPulse,
  Activity,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { MealPlan, HealthMode, Recipe } from '../types';

export const MealPlanner: React.FC = () => {
  const { products, addGroceryItem, settings, updateSettings, recordRecipeCooked } = usePantry();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  
  // Custom Plan triggers
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [healthMode, setHealthMode] = useState<HealthMode>(settings.healthMode);
  
  // Cooking companion triggers
  const [activeCompanionRecipe, setActiveCompanionRecipe] = useState<Recipe | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError('');
    try {
      const plan = await generateDailyMealPlan(products, healthMode, calorieTarget);
      setMealPlan(plan);
      
      // Auto-update health mode settings
      if (healthMode !== settings.healthMode) {
        updateSettings({ healthMode });
      }
    } catch (err: any) {
      setError('AI was unable to generate a plan. Please verify Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGrocery = (ingName: string) => {
    addGroceryItem({
      name: ingName,
      quantity: '1 unit',
      priority: 'medium',
      category: 'Other',
      estimatedCost: 3.50
    });
    alert(`🛒 Added "${ingName}" to your grocery list!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
          AI Meal Planner
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Generate complete daily nutritional meal plans incorporating expiring pantry ingredients.
        </p>
      </div>

      {/* Controls Panel */}
      <GlassCard hoverEffect={false} className="p-6 border border-brand-500/15">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          
          {/* Health Profile Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health/Diet Goal</label>
            <div className="relative">
              <HeartPulse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <select
                value={healthMode}
                onChange={(e) => setHealthMode(e.target.value as HealthMode)}
                className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {['Standard', 'Diabetic', 'Weight Loss', 'Gym / High Protein', 'Pregnant', 'Kid Friendly', 'Heart Healthy', 'Vegetarian', 'Vegan', 'Low Carb'].map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Daily Calorie target */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calorie Intake Target</label>
            <div className="relative">
              <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input
                type="number"
                value={calorieTarget}
                step={100}
                min={1000}
                max={5000}
                onChange={(e) => setCalorieTarget(Number(e.target.value))}
                className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Action generate */}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? 'Synthesizing Plan...' : 'Generate Daily Meal Plan'}
          </button>

        </div>
      </GlassCard>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Meal Plan Results */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-spin mb-4" />
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Consulting Chef AI & Nutritionist...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing food expiration risks and custom calorie bounds.
          </p>
        </div>
      ) : mealPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Meal slots: Breakfast, Lunch, Dinner, Snack */}
          {[
            { slot: 'Breakfast', key: 'breakfast' as const },
            { slot: 'Lunch', key: 'lunch' as const },
            { slot: 'Dinner', key: 'dinner' as const },
            { slot: 'Snacks', key: 'snacks' as const },
          ].map((mealSlot) => {
            const recipe = mealPlan[mealSlot.key];
            if (!recipe) return null;

            return (
              <GlassCard
                key={mealSlot.key}
                hoverEffect={true}
                onClick={() => setActiveCompanionRecipe(recipe)}
                className="p-5 flex flex-col justify-between h-[360px] cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-brand-600 dark:text-brand-450 tracking-wider">
                    {mealSlot.slot}
                  </span>
                  
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white mt-1.5 line-clamp-2">
                    {recipe.name}
                  </h3>

                  <div className="flex gap-4 text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-450" />
                      {recipe.prepTime + recipe.cookTime} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {recipe.calories} kcal
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-4 line-clamp-4">
                    {recipe.instructions[0] || 'Gourmet meal designed for nutrition.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    HEALTH SCORE: {recipe.nutrition.healthScore}%
                  </span>
                  <span className="text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                    Start Cook <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </GlassCard>
            );
          })}

          {/* Missing Ingredients / Shopping list suggestions */}
          {mealPlan.shoppingSuggestions && mealPlan.shoppingSuggestions.length > 0 && (
            <div className="col-span-1 lg:col-span-4 mt-4">
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-white flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-brand-650" />
                Ingredients to Replenish
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {mealPlan.shoppingSuggestions.map((ing, idx) => (
                  <div key={idx} className="glass p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-750 dark:text-slate-200 truncate">
                      {ing}
                    </span>
                    <button
                      onClick={() => handleAddToGrocery(ing)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-650 dark:text-indigo-400"
                      title="Add to Grocery List"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Empty State */
        <div className="glass p-12 rounded-3xl border border-slate-200 dark:border-slate-850 text-center flex flex-col items-center justify-center gap-3">
          <Utensils className="w-12 h-12 text-slate-350" />
          <p className="font-bold text-slate-800 dark:text-slate-200">No Meal Plan generated yet</p>
          <p className="text-xs text-slate-450">Configure your target calories and tap generate to consult Chef AI.</p>
        </div>
      )}

      {/* Cooking Companion Active Walkthrough */}
      {activeCompanionRecipe && (
        <RecipeCompanion
          recipe={activeCompanionRecipe}
          onClose={() => setActiveCompanionRecipe(null)}
          onCookComplete={() => recordRecipeCooked(activeCompanionRecipe)}
        />
      )}

    </div>
  );
};
