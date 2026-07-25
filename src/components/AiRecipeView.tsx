import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Sparkles, 
  Clock, 
  Flame, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Printer, 
  Copy, 
  RefreshCw, 
  Loader2, 
  Check, 
  X,
  ChefHat,
  Filter
} from 'lucide-react';
import { Product, Recipe } from '../types';
import { getDaysUntilExpiry } from '../utils/dateUtils';

interface AiRecipeViewProps {
  products: Product[];
  bookmarkedRecipes: Recipe[];
  onToggleBookmark: (recipe: Recipe) => void;
  dietaryPreference: string;
  selectedFocusProduct?: Product | null;
}

export const AiRecipeView: React.FC<AiRecipeViewProps> = ({
  products,
  bookmarkedRecipes,
  onToggleBookmark,
  dietaryPreference,
  selectedFocusProduct,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState(dietaryPreference || 'None');
  const [customPrompt, setCustomPrompt] = useState('');

  // Get active expiring items
  const expiringProducts = products.filter(p => !p.isUsed && getDaysUntilExpiry(p.expiryDate) <= 7);

  useEffect(() => {
    generateRecipes();
  }, [selectedFocusProduct]);

  const generateRecipes = async () => {
    setIsLoading(true);
    try {
      const payloadProducts = expiringProducts.map(p => ({
        name: p.name,
        category: p.category,
        daysRemaining: getDaysUntilExpiry(p.expiryDate),
      }));

      let promptText = customPrompt;
      if (selectedFocusProduct) {
        promptText = `Focus specifically on creating a recipe using ${selectedFocusProduct.name}.`;
      }

      const response = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: payloadProducts,
          preferences: dietaryFilter,
          prompt: promptText,
        }),
      });

      if (!response.ok) throw new Error('Recipe generation failed');

      const data = await response.json();
      if (data.recipes && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
      }
    } catch (err) {
      console.error('Recipe Generation Error:', err);
      // Fallback sample recipe
      setRecipes([
        {
          id: 'r1',
          title: 'Berry & Milk Shake',
          emoji: '🍓',
          description: 'A creamy strawberry smoothie utilizing expiring milk and fresh strawberries.',
          difficulty: 'Easy',
          prepTime: '5 mins',
          cookTime: '0 mins',
          calories: 210,
          servings: 2,
          ingredients: [
            { item: 'Organic Whole Milk', amount: '1 cup', isFromInventory: true },
            { item: 'Fresh Strawberries', amount: '1 cup', isFromInventory: true },
            { item: 'Honey', amount: '1 tbsp', isFromInventory: false },
          ],
          instructions: [
            'Wash the strawberries thoroughly and remove stems.',
            'Pour 1 cup of whole milk into a high-speed blender.',
            'Add strawberries and 1 tablespoon of honey or sweetener.',
            'Blend on high for 60 seconds until silky smooth.',
            'Serve chilled with ice cubes.'
          ],
          nutrition: { protein: '8g', carbs: '28g', fat: '7g', fiber: '3g' },
          tips: ['Add protein powder for post-workout boost'],
          storageInstructions: 'Best consumed immediately or store chilled up to 12 hours.',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isBookmarked = (recipeId: string) => {
    return bookmarkedRecipes.some(r => r.id === recipeId);
  };

  const copyRecipe = (r: Recipe) => {
    const text = `Recipe: ${r.title}\n\nIngredients:\n${r.ingredients.map(i => `- ${i.amount} ${i.item}`).join('\n')}\n\nInstructions:\n${r.instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Recipe copied to clipboard!');
  };

  const printRecipe = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      
      {/* Header Banner - Professional Polish Theme */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 to-indigo-800 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
            <span>AI Chef Recommendation & Zero-Waste</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to cook zero-waste?
          </h1>
          <p className="text-sm text-indigo-100 mt-1 max-w-xl leading-relaxed">
            Prioritizing items expiring soon in your pantry ({expiringProducts.length} items expiring within 7 days).
          </p>
        </div>

        <button
          onClick={generateRecipes}
          disabled={isLoading}
          className="relative z-10 px-6 py-3.5 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2.5 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-indigo-900 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 text-indigo-900" />
          )}
          <span>{isLoading ? 'Crafting Recipes...' : 'Generate AI Recipes'}</span>
        </button>

        {/* Decorative background blurs */}
        <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-40px] left-20 w-48 h-48 bg-teal-400 rounded-full blur-[60px] opacity-10 pointer-events-none"></div>
      </div>

      {/* Dietary & Custom Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">Diet:</span>
          {['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Quick < 15m'].map(pref => (
            <button
              key={pref}
              onClick={() => setDietaryFilter(pref)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                dietaryFilter === pref
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pref}
            </button>
          ))}
        </div>

        {/* Custom Request Input */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="e.g. Italian style, low calorie..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none w-full md:w-48"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <ChefHat className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Chef Gemini is analyzing your expiring items...
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Matching ingredients, balancing nutrition macros, and preparing step-by-step cooking instructions.
          </p>
        </div>
      ) : (
        /* Recipes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => {
            const bookmarked = isBookmarked(r.id);

            return (
              <div 
                key={r.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Recipe Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        {r.emoji || '🥗'}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                          {r.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{r.difficulty} • {r.calories} kcal</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleBookmark(r)}
                      className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                      title={bookmarked ? 'Remove Bookmark' : 'Bookmark Recipe'}
                    >
                      {bookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
                    {r.description}
                  </p>

                  {/* Quick Specs */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {r.prepTime} prep
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {r.cookTime} cook
                    </span>
                  </div>

                  {/* Ingredients from inventory preview */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Ingredients ({r.ingredients.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.ingredients.slice(0, 4).map((ing, idx) => (
                        <span 
                          key={idx}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                            ing.isFromInventory
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50'
                          }`}
                        >
                          {ing.item} {ing.isFromInventory && '🌱'}
                        </span>
                      ))}
                      {r.ingredients.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{r.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedRecipe(r)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 font-bold text-xs transition-colors shadow-sm text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2"
                  >
                    <span>View Recipe Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Full Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedRecipe.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedRecipe.title}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedRecipe.description}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Macros & Stats */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Calories</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">{selectedRecipe.calories} kcal</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Protein</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecipe.nutrition.protein}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Carbs</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecipe.nutrition.carbs}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Fat</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecipe.nutrition.fat}</span>
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                  Ingredients Needed
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {ing.item}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-500">{ing.amount}</span>
                        {ing.isFromInventory && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                            In Pantry
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                  Step-by-Step Instructions
                </h3>
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2">
              <button
                onClick={() => copyRecipe(selectedRecipe)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>

              <button
                onClick={printRecipe}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button
                onClick={() => onToggleBookmark(selectedRecipe)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                  isBookmarked(selectedRecipe.id)
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isBookmarked(selectedRecipe.id) ? 'Bookmarked' : 'Save Recipe'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
