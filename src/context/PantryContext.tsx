import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, GroceryItem, MealPlan, Recipe, ActivityLog, UserSettings, HealthMode, ProductCategory, PantryLocation } from '../types';

interface PantryContextType {
  products: Product[];
  groceryList: GroceryItem[];
  mealPlans: { [date: string]: MealPlan };
  favoriteRecipes: Recipe[];
  cookedHistory: { recipeId: string; recipeName: string; date: string }[];
  activityLogs: ActivityLog[];
  settings: UserSettings;
  addProduct: (product: Omit<Product, 'id' | 'status'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  markProductUsed: (id: string) => void;
  togglePinProduct: (id: string) => void;
  toggleFavoriteProduct: (id: string) => void;
  openProduct: (id: string) => void;
  
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'checked'>) => void;
  toggleGroceryItem: (id: string) => void;
  deleteGroceryItem: (id: string) => void;
  clearCheckedGrocery: () => void;
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => void;
  
  saveMealPlan: (date: string, plan: MealPlan) => void;
  toggleFavoriteRecipe: (recipe: Recipe) => void;
  recordRecipeCooked: (recipe: Recipe) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  
  // Backups
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  notificationsEnabled: true,
  reminderDays: [7, 3, 2, 1, 0],
  language: 'en',
  healthMode: 'Standard',
  familyMembers: ['Varshita', 'Mom', 'Dad'],
};

// High-fidelity pre-populated items
const MOCK_PRODUCTS = (): Product[] => {
  const today = new Date();
  
  const getOffsetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'p-1',
      name: 'Organic Whole Milk',
      brand: 'Kirkland Signature',
      expiryDate: getOffsetDate(1), // Expires tomorrow
      mfgDate: getOffsetDate(-6),
      category: 'Dairy',
      quantity: 1,
      notes: 'For breakfast milkshakes and coffee.',
      location: 'Refrigerator',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
      status: 'expiring',
      opened: true,
      openedDate: getOffsetDate(-3),
      pinned: true,
      isFavorite: true,
      assignedTo: 'Varshita',
    },
    {
      id: 'p-2',
      name: 'Fresh Strawberries',
      brand: 'Driscoll\'s',
      expiryDate: getOffsetDate(2), // Expires in 2 days
      mfgDate: getOffsetDate(-3),
      category: 'Fruits',
      quantity: 2,
      notes: 'Wash before eating. Great for salads.',
      location: 'Refrigerator',
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300',
      status: 'expiring',
      opened: false,
      pinned: true,
      isFavorite: false,
    },
    {
      id: 'p-3',
      name: 'Baby Spinach',
      brand: 'Organic Girl',
      expiryDate: getOffsetDate(0), // Expires today
      mfgDate: getOffsetDate(-5),
      category: 'Vegetables',
      quantity: 1,
      notes: 'Eat quickly. Wilting soon.',
      location: 'Refrigerator',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300',
      status: 'expiring',
      opened: true,
      openedDate: getOffsetDate(-2),
      pinned: false,
      isFavorite: false,
    },
    {
      id: 'p-4',
      name: 'Ibuprofen Tablets 200mg',
      brand: 'Advil',
      expiryDate: getOffsetDate(-15), // Expired
      mfgDate: getOffsetDate(-730),
      category: 'Medicine',
      quantity: 50,
      notes: 'Pain reliever and fever reducer.',
      location: 'Medicine Cabinet',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
      status: 'expired',
      opened: true,
      pinned: false,
      isFavorite: false,
    },
    {
      id: 'p-5',
      name: 'Avocados',
      brand: 'Hass',
      expiryDate: getOffsetDate(5), // Fresh
      mfgDate: getOffsetDate(-2),
      category: 'Fruits',
      quantity: 3,
      notes: 'Keep on shelf until ripe, then move to fridge.',
      location: 'Kitchen Shelf',
      imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300',
      status: 'fresh',
      opened: false,
      pinned: false,
      isFavorite: false,
    },
    {
      id: 'p-6',
      name: 'Sourdough Bread',
      brand: 'San Francisco Bakery',
      expiryDate: getOffsetDate(3), // Expiring in 3 days
      mfgDate: getOffsetDate(-2),
      category: 'Bakery',
      quantity: 1,
      notes: 'Delicious toasted with avocado.',
      location: 'Pantry',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
      status: 'fresh',
      opened: false,
      pinned: false,
      isFavorite: false,
    },
    {
      id: 'p-7',
      name: 'Frozen Atlantic Salmon',
      brand: 'Sea Best',
      expiryDate: getOffsetDate(60), // Fresh
      mfgDate: getOffsetDate(-10),
      category: 'Frozen Food',
      quantity: 4,
      notes: 'Individually vacuum packed fillets.',
      location: 'Freezer',
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300',
      status: 'fresh',
      opened: false,
      pinned: false,
      isFavorite: false,
    },
    {
      id: 'p-8',
      name: 'Greek Yogurt (Plain)',
      brand: 'Chobani',
      expiryDate: getOffsetDate(7), // Fresh / Border
      mfgDate: getOffsetDate(-7),
      category: 'Dairy',
      quantity: 1,
      notes: 'Great source of protein.',
      location: 'Refrigerator',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300',
      status: 'fresh',
      opened: false,
      pinned: false,
      isFavorite: false,
    }
  ];
};

const INITIAL_GROCERY = [
  { id: 'g-1', name: 'Eggs (Dozen)', quantity: '1', priority: 'high', category: 'Dairy', estimatedCost: 4.5, checked: false },
  { id: 'g-2', name: 'Almond Butter', quantity: '1 jar', priority: 'medium', category: 'Snacks', estimatedCost: 8.0, checked: false },
  { id: 'g-3', name: 'Apples', quantity: '5', priority: 'low', category: 'Fruits', estimatedCost: 3.5, checked: true },
];

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [mealPlans, setMealPlans] = useState<{ [date: string]: MealPlan }>({});
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [cookedHistory, setCookedHistory] = useState<{ recipeId: string; recipeName: string; date: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Load Initial Data from LocalStorage or Load Mocks
  useEffect(() => {
    const localProds = localStorage.getItem('se_products');
    const localGroceries = localStorage.getItem('se_groceries');
    const localMealPlans = localStorage.getItem('se_meal_plans');
    const localFavs = localStorage.getItem('se_favorite_recipes');
    const localHistory = localStorage.getItem('se_cooked_history');
    const localLogs = localStorage.getItem('se_activity_logs');
    const localSettings = localStorage.getItem('se_settings');

    if (localProds) setProducts(JSON.parse(localProds));
    else setProducts(MOCK_PRODUCTS());

    if (localGroceries) setGroceryList(JSON.parse(localGroceries));
    else setGroceryList(INITIAL_GROCERY as GroceryItem[]);

    if (localMealPlans) setMealPlans(JSON.parse(localMealPlans));
    if (localFavs) setFavoriteRecipes(JSON.parse(localFavs));
    if (localHistory) setCookedHistory(JSON.parse(localHistory));
    if (localLogs) setActivityLogs(JSON.parse(localLogs));
    
    if (localSettings) setSettings(JSON.parse(localSettings));
  }, []);

  // Save to LocalStorage helpers
  const saveProducts = (prods: Product[]) => {
    setProducts(prods);
    localStorage.setItem('se_products', JSON.stringify(prods));
  };

  const saveGroceries = (items: GroceryItem[]) => {
    setGroceryList(items);
    localStorage.setItem('se_groceries', JSON.stringify(items));
  };

  const saveLogs = (logs: ActivityLog[]) => {
    setActivityLogs(logs);
    localStorage.setItem('se_activity_logs', JSON.stringify(logs));
  };

  // Recalculate status based on current date
  const computeProductStatus = (expiryStr: string): Product['status'] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryStr);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';
    return 'fresh';
  };

  // Log Activity Helper
  const addActivity = (action: ActivityLog['action'], productName: string, details?: string) => {
    const newLog: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userId: 'mock-user-id',
      userName: settings.familyMembers[0] || 'User',
      action,
      productName,
      details,
      timestamp: Date.now(),
    };
    const updated = [newLog, ...activityLogs].slice(0, 50); // limit to 50 logs
    saveLogs(updated);
  };

  // Product Actions
  const addProduct = (p: Omit<Product, 'id' | 'status'>) => {
    const status = computeProductStatus(p.expiryDate);
    const newProduct: Product = {
      ...p,
      id: 'p-' + Math.random().toString(36).substr(2, 9),
      status,
    };
    const updated = [newProduct, ...products];
    saveProducts(updated);
    addActivity('added', p.name, `Added to ${p.location}`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        const merged = { ...p, ...updates };
        if (updates.expiryDate) {
          merged.status = computeProductStatus(updates.expiryDate);
        }
        return merged;
      }
      return p;
    });
    saveProducts(updated);

    const product = products.find((p) => p.id === id);
    if (product) {
      if (updates.location && updates.location !== product.location) {
        addActivity('moved', product.name, `Moved from ${product.location} to ${updates.location}`);
      } else {
        addActivity('opened', product.name, `Updated details`);
      }
    }
  };

  const deleteProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
    if (p) {
      addActivity('expired', p.name, `Deleted from storage`);
    }
  };

  const markProductUsed = (id: string) => {
    const p = products.find((x) => x.id === id);
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
    if (p) {
      addActivity('used', p.name, `Consumed completely`);
      
      // Auto-add to grocery list suggestion
      const alreadyInList = groceryList.some((g) => g.name.toLowerCase() === p.name.toLowerCase());
      if (!alreadyInList) {
        addGroceryItem({
          name: p.name,
          quantity: '1',
          priority: 'medium',
          category: p.category,
          estimatedCost: p.mrp || 4.0,
        });
      }
    }
  };

  const togglePinProduct = (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p));
    saveProducts(updated);
  };

  const toggleFavoriteProduct = (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    saveProducts(updated);
  };

  const openProduct = (id: string) => {
    const updated = products.map((p) =>
      p.id === id && !p.opened
        ? { ...p, opened: true, openedDate: new Date().toISOString().split('T')[0] }
        : p
    );
    saveProducts(updated);
    const p = products.find((x) => x.id === id);
    if (p && !p.opened) {
      addActivity('opened', p.name, 'Marked as opened');
    }
  };

  // Grocery Actions
  const addGroceryItem = (item: Omit<GroceryItem, 'id' | 'checked'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: 'g-' + Math.random().toString(36).substr(2, 9),
      checked: false,
    };
    const updated = [...groceryList, newItem];
    saveGroceries(updated);
  };

  const toggleGroceryItem = (id: string) => {
    const updated = groceryList.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveGroceries(updated);
  };

  const deleteGroceryItem = (id: string) => {
    const updated = groceryList.filter((item) => item.id !== id);
    saveGroceries(updated);
  };

  const clearCheckedGrocery = () => {
    const updated = groceryList.filter((item) => !item.checked);
    saveGroceries(updated);
  };

  const updateGroceryItem = (id: string, updates: Partial<GroceryItem>) => {
    const updated = groceryList.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveGroceries(updated);
  };

  // Meal Plan Actions
  const saveMealPlan = (date: string, plan: MealPlan) => {
    const updated = { ...mealPlans, [date]: plan };
    setMealPlans(updated);
    localStorage.setItem('se_meal_plans', JSON.stringify(updated));
  };

  // Favorite Recipes
  const toggleFavoriteRecipe = (recipe: Recipe) => {
    const exists = favoriteRecipes.some((r) => r.id === recipe.id);
    let updated: Recipe[];
    if (exists) {
      updated = favoriteRecipes.filter((r) => r.id !== recipe.id);
    } else {
      updated = [...favoriteRecipes, { ...recipe, isFavorite: true }];
    }
    setFavoriteRecipes(updated);
    localStorage.setItem('se_favorite_recipes', JSON.stringify(updated));
  };

  const recordRecipeCooked = (recipe: Recipe) => {
    const record = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [record, ...cookedHistory].slice(0, 30);
    setCookedHistory(updated);
    localStorage.setItem('se_cooked_history', JSON.stringify(updated));
    addActivity('used', recipe.name, 'Cooked this recipe');
  };

  // Settings Actions
  const updateSettings = (updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem('se_settings', JSON.stringify(updated));
  };

  // Backup & Restore
  const exportData = () => {
    const backupObj = {
      products,
      groceryList,
      mealPlans,
      favoriteRecipes,
      cookedHistory,
      activityLogs,
      settings,
      version: '2.0.0',
      exportedAt: Date.now(),
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products) saveProducts(parsed.products);
      if (parsed.groceryList) saveGroceries(parsed.groceryList);
      if (parsed.mealPlans) {
        setMealPlans(parsed.mealPlans);
        localStorage.setItem('se_meal_plans', JSON.stringify(parsed.mealPlans));
      }
      if (parsed.favoriteRecipes) {
        setFavoriteRecipes(parsed.favoriteRecipes);
        localStorage.setItem('se_favorite_recipes', JSON.stringify(parsed.favoriteRecipes));
      }
      if (parsed.cookedHistory) {
        setCookedHistory(parsed.cookedHistory);
        localStorage.setItem('se_cooked_history', JSON.stringify(parsed.cookedHistory));
      }
      if (parsed.activityLogs) saveLogs(parsed.activityLogs);
      if (parsed.settings) {
        setSettings(parsed.settings);
        localStorage.setItem('se_settings', JSON.stringify(parsed.settings));
      }
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  };

  return (
    <PantryContext.Provider
      value={{
        products,
        groceryList,
        mealPlans,
        favoriteRecipes,
        cookedHistory,
        activityLogs,
        settings,
        addProduct,
        updateProduct,
        deleteProduct,
        markProductUsed,
        togglePinProduct,
        toggleFavoriteProduct,
        openProduct,
        addGroceryItem,
        toggleGroceryItem,
        deleteGroceryItem,
        clearCheckedGrocery,
        updateGroceryItem,
        saveMealPlan,
        toggleFavoriteRecipe,
        recordRecipeCooked,
        updateSettings,
        exportData,
        importData,
      }}
    >
      {children}
    </PantryContext.Provider>
  );
};

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (!context) throw new Error('usePantry must be used within a PantryProvider');
  return context;
};
