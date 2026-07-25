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

export type ProductLocation = 
  | 'Kitchen'
  | 'Refrigerator'
  | 'Medicine Box'
  | 'Shelf'
  | 'Pantry'
  | 'Freezer'
  | 'Other';

export type ProductStatus = 'Fresh' | 'Expiring Soon' | 'Expired';

export type ScanSource = 'Camera' | 'Upload' | 'Barcode' | 'Manual';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  expiryDate: string; // YYYY-MM-DD
  mfdDate?: string; // YYYY-MM-DD
  barcode?: string;
  category: ProductCategory;
  quantity: number;
  unit: string; // e.g. pcs, kg, g, L, mL, pack
  notes?: string;
  location: ProductLocation;
  image?: string;
  batchNumber?: string;
  mrp?: string;
  price?: number;
  source: ScanSource;
  createdAt: string;
  updatedAt: string;
  isUsed?: boolean;
  usedAt?: string;
  ocrConfidence?: number;
}

export interface Ingredient {
  item: string;
  amount: string;
  isFromInventory?: boolean;
}

export interface NutritionInfo {
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: string;
  cookTime: string;
  calories: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  tips?: string[];
  storageInstructions?: string;
  isBookmarked?: boolean;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recipes?: Recipe[];
  timestamp: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  reminderDays: number[]; // e.g. [7, 3, 2, 1, 0]
  enableBrowserNotifications: boolean;
  dietaryPreference: string; // 'None' | 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Keto'
  currency: string; // '$' | '₹' | '€' | '£'
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isGuest?: boolean;
}

export interface OcrScanResult {
  productName?: string;
  brand?: string;
  expiryDate?: string;
  mfdDate?: string;
  barcode?: string;
  batchNumber?: string;
  mrp?: string;
  category?: ProductCategory;
  confidenceScore?: number;
  rawText?: string;
  detectionMethod?: string;
  reason?: string;
}

export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit?: string;
  priority: PriorityLevel;
  notes?: string;
  expectedPrice?: number;
  store?: string;
  isPurchased: boolean;
  createdAt: string;
  reason?: string;
  purchasedAt?: string;
}

export interface VoiceCommandParseResult {
  action: 'add_product' | 'add_shopping' | 'query_expiry' | 'generate_recipe' | 'delete_product' | 'navigate' | 'general_qa' | 'clarification_needed';
  productName?: string;
  expiryDate?: string;
  quantity?: number;
  unit?: string;
  category?: ProductCategory;
  location?: ProductLocation;
  brand?: string;
  notes?: string;
  targetTab?: string;
  missingFields?: string[];
  replyText: string;
}

