import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePantry } from '../context/PantryContext';
import { generateRecipesFromIngredients } from '../services/gemini';
import { GlassCard } from '../components/GlassCard';
import { RecipeCompanion } from '../components/RecipeCompanion';
import { 
  Sparkles, 
  ChefHat, 
  Clock, 
  Flame, 
  BookHeart,
  Calendar,
  AlertTriangle,
  Loader2,
  Printer,
  Copy,
  Check,
  ChevronRight,
  UtensilsCrossed,
  Layers,
  Heart
} from 'lucide-react';
import { Recipe, HealthMode } from '../types';

export const RecipeBook: React.FC = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state as { priorityIngredient?: string } | null;
  const { products, settings, favoriteRecipes, toggleFavoriteRecipe, recordRecipeCooked } = usePantry();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Recipe filters
  const [selectedCuisine, setSelectedCuisine] = useState('Any');
  const [healthGoal, setHealthGoal] = useState<HealthMode>(settings.healthMode);
  
  // Checked ingredients to cook with
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  
  // Cooking companion states
  const [activeCompanionRecipe, setActiveCompanionRecipe] = useState<Recipe | null>(null);

  // Load ingredients from products
  const ingredientChoices = useMemo(() => {
    // Unique product names
    const names = Array.from(new Set(products.map((p) => p.name)));
    return names.map(name => {
      const isExpiring = products.some(p => p.name === name && (p.status === 'expiring' || p.status === 'expired'));
      return { name, isExpiring };
    });
  }, [products]);

  // Pre-select priority ingredient if redirected
  useEffect(() => {
    if (locationState?.priorityIngredient) {
      setCheckedIngredients([locationState.priorityIngredient]);
    } else {
      // Precheck expiring items by default
      const expiring = products.filter(p => p.status === 'expiring' || p.status === 'expired').map(p => p.name);
      setCheckedIngredients(Array.from(new Set(expiring)));
    }
  }, [locationState, products]);

  const handleToggleIng = (name: string) => {
    setCheckedIngredients(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    // Extract expiring items from selection
    const expiringSelection = products
      .filter(p => checkedIngredients.includes(p.name) && (p.status === 'expiring' || p.status === 'expired'))
      .map(p => p.name);

    try {
      const generated = await generateRecipesFromIngredients(
        checkedIngredients,
        expiringSelection,
        selectedCuisine,
        healthGoal
      );
      setRecipes(generated);
    } catch (err: any) {
      setError('AI failed to build recipes. Please verify Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFav = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteRecipe(recipe);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight">
          AI Recipe Generator 2.0
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Select current ingredients, pick a cuisine style, and let the AI generate gourmet recipes.
        </p>
      </div>

      {/* Main Grid Layout: Ingredients Left, Recipes Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Select Ingredients panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <GlassCard hoverEffect={false} className="p-5 flex flex-col gap-5">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-850 pb-2">
              Select Cooking Ingredients
            </h3>

            {ingredientChoices.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-6">Your pantry is empty. Add items first!</p>
            ) : (
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2.5 pr-2">
                {ingredientChoices.map((choice) => (
                  <label 
                    key={choice.name} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checkedIngredients.includes(choice.name)
                        ? 'bg-brand-500/5 border-brand-500/30'
                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checkedIngredients.includes(choice.name)}
                        onChange={() => handleToggleIng(choice.name)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-semibold text-slate-750 dark:text-slate-200">
                        {choice.name}
                      </span>
                    </div>

                    {choice.isExpiring && (
                      <span className="text-[9px] font-bold bg-amber-500/10 text-amber-650 px-2 py-0.5 rounded-full uppercase">
                        Expiring
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}

            {/* Recipe Configurations */}
            <div className="flex flex-col gap-3">
              {/* Cuisine Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cuisine Type</label>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 dark:text-slate-350"
                >
                  <option value="Any">Any Cuisine</option>
                  <option value="Indian">Indian</option>
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              {/* Health goal */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">AI Health Goal</label>
                <select
                  value={healthGoal}
                  onChange={(e) => setHealthGoal(e.target.value as HealthMode)}
                  className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 dark:text-slate-350"
                >
                  {['Standard', 'Diabetic', 'Weight Loss', 'Gym / High Protein', 'Pregnant', 'Kid Friendly', 'Heart Healthy', 'Vegetarian', 'Vegan', 'Low Carb'].map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || checkedIngredients.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Cooking Recipes...' : 'Generate Recipes AI'}
            </button>
          </GlassCard>

          {/* Bookmarks & Favorites Panel */}
          {favoriteRecipes.length > 0 && (
            <GlassCard hoverEffect={false} className="p-5">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
                Saved Cookbook ({favoriteRecipes.length})
              </h3>
              <div className="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1">
                {favoriteRecipes.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => setActiveCompanionRecipe(fav)}
                    className="glass p-3 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between cursor-pointer hover:border-brand-500/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/5 text-red-500 flex items-center justify-center font-bold text-xs">❤️</div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">{fav.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{fav.cuisine}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      Cook <ChevronRight className="w-3.5 h-3.5 text-slate-455" />
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Side: Generated Recipe Cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="glass p-20 rounded-3xl border border-slate-200 dark:border-slate-850 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-spin mb-4" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Generating recipes...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Consulting culinary models. Formatting nutritional details.</p>
            </div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipes.map((recipe) => (
                <GlassCard
                  key={recipe.id}
                  hoverEffect={true}
                  onClick={() => setActiveCompanionRecipe(recipe)}
                  className="flex flex-col justify-between h-[420px] cursor-pointer"
                >
                  <div className="flex flex-col gap-4">
                    {/* Image block */}
                    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🍳</div>
                      )}
                      
                      {/* Heart bookmark check */}
                      <button
                        onClick={(e) => handleToggleFav(recipe, e)}
                        className="absolute top-2.5 right-2.5 w-7.5 h-7.5 rounded-full bg-white/70 dark:bg-slate-950/70 backdrop-blur flex items-center justify-center shadow-md border border-slate-200/20"
                      >
                        <Heart 
                          className={`w-4 h-4 transition-colors ${
                            favoriteRecipes.some(r => r.name === recipe.name) 
                              ? 'text-red-500 fill-current' 
                              : 'text-slate-400 hover:text-red-500'
                          }`} 
                        />
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{recipe.cuisine}</span>
                        <span>{recipe.difficulty}</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-850 dark:text-white mt-1 line-clamp-2">
                        {recipe.name}
                      </h3>
                    </div>
                  </div>

                  {/* Nutrition details grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850 mt-4 text-[10px] font-semibold text-slate-500">
                    <div className="text-center">
                      <span className="block font-bold text-slate-700 dark:text-slate-350">{recipe.calories} kcal</span>
                      <span>Calories</span>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-slate-800">
                      <span className="block font-bold text-slate-700 dark:text-slate-350">{recipe.nutrition.protein}g</span>
                      <span>Protein</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-bold text-slate-700 dark:text-slate-350">{recipe.nutrition.healthScore}%</span>
                      <span>Health Score</span>
                    </div>
                  </div>

                  {/* Action bottom */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-450" />
                      COOK: {recipe.prepTime + recipe.cookTime} MINS
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                      Launch Assistant <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="glass p-16 rounded-3xl border border-slate-200 dark:border-slate-850 text-center flex flex-col items-center justify-center gap-4">
              <ChefHat className="w-12 h-12 text-slate-350 animate-float" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">No recipes loaded yet</p>
                <p className="text-xs text-slate-450 mt-1">Select available ingredients on the left and tap generate recipes.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Cooking Walkthrough Companion Modal */}
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


