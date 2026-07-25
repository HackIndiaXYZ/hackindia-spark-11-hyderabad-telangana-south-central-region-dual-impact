export interface Product {
  id: string;
  name: string;
  brand: string;
  expiryDate: string; // ISO String (YYYY-MM-DD)
  mfgDate?: string;
  openedDate?: string;
  usedDate?: string;
  expiredDate?: string;
  barcode?: string;
  category: ProductCategory;
  quantity: number;
  notes?: string;
  location: PantryLocation;
  imageUrl?: string;
  status: 'fresh' | 'expiring' | 'expired';
  mrp?: number;
  batch?: string;
  confidence?: number; // OCR confidence score (0-100)
  opened: boolean;
  pinned: boolean;
  isFavorite: boolean;
  assignedTo?: string; // Family member name
}

export type ProductCategory =
  | 'Medicine'
  | 'Dairy'
  | 'Vegetables'
  | 'Fruits'
  | 'Bakery'
  | 'Snacks'
  | 'Frozen Food'
  | 'Beverages'
  | 'Cosmetics'
  | 'Baby Products'
  | 'Supplements'
  | 'Other';

export type PantryLocation =
  | 'Pantry'
  | 'Refrigerator'
  | 'Freezer'
  | 'Medicine Cabinet'
  | 'Bathroom'
  | 'Kitchen Shelf';

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // in mins
  cookTime: number; // in mins
  calories: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  nutrition: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber: number; // grams
    sugar: number; // grams
    sodium?: number; // mg
    healthScore: number; // 0-100
  };
  substitutes?: { [ingredient: string]: string };
  tips?: string[];
  mistakes?: string[];
  storage?: string;
  leftovers?: string;
  isFavorite: boolean;
  imageUrl?: string;
}

export interface MealPlan {
  date: string; // YYYY-MM-DD
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
  snacks: Recipe | null;
  shoppingSuggestions?: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedCost: number;
  checked: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'added' | 'expired' | 'used' | 'moved' | 'opened';
  productName: string;
  details?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  reminderDays: number[]; // e.g. [7, 3, 2, 1, 0] (days before to notify)
  language: string;
  healthMode: HealthMode;
  familyMembers: string[];
}

export type HealthMode =
  | 'Standard'
  | 'Diabetic'
  | 'Weight Loss'
  | 'Gym / High Protein'
  | 'Pregnant'
  | 'Kid Friendly'
  | 'Heart Healthy'
  | 'Vegetarian'
  | 'Vegan'
  | 'Low Carb';
