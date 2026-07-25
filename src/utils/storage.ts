import { Product, UserPreferences, User, Recipe, ShoppingItem } from '../types';

export function loadShoppingItems(): ShoppingItem[] {
  try {
    const data = localStorage.getItem(SHOPPING_KEY);
    if (!data) {
      saveShoppingItems(INITIAL_SHOPPING_ITEMS);
      return INITIAL_SHOPPING_ITEMS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading shopping items:', e);
    return INITIAL_SHOPPING_ITEMS;
  }
}

export function saveShoppingItems(items: ShoppingItem[]): void {
  try {
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving shopping items:', e);
  }
}


const PRODUCTS_KEY = 'smart_expiry_scanner_products_v1';
const PREFS_KEY = 'smart_expiry_scanner_prefs_v1';
const USER_KEY = 'smart_expiry_scanner_user_v1';
const BOOKMARKS_KEY = 'smart_expiry_scanner_bookmarks_v1';
const SHOPPING_KEY = 'smart_expiry_scanner_shopping_v1';

export const INITIAL_SHOPPING_ITEMS: any[] = [
  {
    id: 's1',
    name: 'Whole Milk (2 Gallons)',
    category: 'Dairy',
    quantity: 2,
    unit: 'L',
    priority: 'High',
    notes: 'Buy Organic Horizon if available',
    expectedPrice: 4.20,
    store: 'Whole Foods',
    isPurchased: false,
    createdAt: new Date().toISOString(),
    reason: 'Finished recently',
  },
  {
    id: 's2',
    name: 'Whole Wheat Bread',
    category: 'Bakery',
    quantity: 1,
    unit: 'pack',
    priority: 'Medium',
    notes: 'Sourdough or Multigrain',
    expectedPrice: 3.50,
    store: 'Trader Joe\'s',
    isPurchased: false,
    createdAt: new Date().toISOString(),
    reason: 'Smart Suggestion',
  },
  {
    id: 's3',
    name: 'Organic Eggs',
    category: 'Other',
    quantity: 1,
    unit: 'pack',
    priority: 'High',
    notes: 'Grade A Large',
    expectedPrice: 4.80,
    store: 'Local Market',
    isPurchased: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    purchasedAt: new Date().toISOString(),
    reason: 'Weekly Restock',
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'One Dozen Eggs',
    brand: 'Farm Fresh',
    expiryDate: '2026-03-20',
    mfdDate: '2026-03-01',
    category: 'Other',
    quantity: 12,
    unit: 'pcs',
    location: 'Refrigerator',
    notes: 'Grade A Large Eggs',
    image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80',
    source: 'Upload',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 4.50,
  },
  {
    id: 'p2',
    name: 'BRITANNIA Snack Pack',
    brand: 'Britannia',
    expiryDate: '2026-03-09',
    mfdDate: '2025-09-09',
    barcode: '8901063092839',
    category: 'Snacks',
    quantity: 2,
    unit: 'pack',
    location: 'Pantry',
    notes: 'Crispy butter cookies',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    source: 'Upload',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 2.20,
  },
  {
    id: 'p3',
    name: 'Seroflo 250 Inhaler',
    brand: 'Cipla',
    expiryDate: '2026-12-31',
    mfdDate: '2024-01-10',
    category: 'Medicine',
    quantity: 1,
    unit: 'pcs',
    location: 'Medicine Box',
    notes: 'Asthma maintenance inhaler',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    source: 'Camera',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 18.00,
  },
  {
    id: 'p4',
    name: 'Organic Whole Milk',
    brand: 'Horizon Organic',
    expiryDate: '2026-07-26', // Expiring Soon (in ~2 days relative to current date)
    mfdDate: '2026-07-10',
    category: 'Dairy',
    quantity: 1,
    unit: 'L',
    location: 'Refrigerator',
    notes: 'Pasteurized 3.25% Fat',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
    source: 'Barcode',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 3.80,
  },
  {
    id: 'p5',
    name: 'Artisan Sourdough Bread',
    brand: 'Local Bakery',
    expiryDate: '2026-07-27', // Expiring in ~3 days
    mfdDate: '2026-07-22',
    category: 'Bakery',
    quantity: 1,
    unit: 'pack',
    location: 'Kitchen',
    notes: 'Freshly baked sourdough',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    source: 'Manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 5.00,
  },
  {
    id: 'p6',
    name: 'Fresh Strawberries',
    brand: 'Driscoll\'s',
    expiryDate: '2026-07-25', // Expiring Tomorrow!
    category: 'Fruits',
    quantity: 1,
    unit: 'pack',
    location: 'Refrigerator',
    notes: 'Sweet sweet berries',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    source: 'Camera',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 4.00,
  }
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  reminderDays: [7, 3, 2, 1, 0],
  enableBrowserNotifications: true,
  dietaryPreference: 'None',
  currency: '$',
};

export const DEFAULT_USER: User = {
  uid: 'guest-101',
  email: 'alex.dev@example.com',
  displayName: 'Alex Rivers',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  isGuest: true,
};

export function getInitialDemoData(): Product[] {
  return INITIAL_PRODUCTS;
}

export function loadProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading products from localStorage:', e);
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export function loadPreferences(): UserPreferences {
  try {
    const data = localStorage.getItem(PREFS_KEY);
    return data ? JSON.parse(data) : DEFAULT_PREFERENCES;
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error saving preferences:', e);
  }
}

export function loadUser(): User {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : DEFAULT_USER;
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function saveUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving user:', e);
  }
}

export function loadBookmarkedRecipes(): Recipe[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveBookmarkedRecipes(recipes: Recipe[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.error('Error saving recipe bookmarks:', e);
  }
}
