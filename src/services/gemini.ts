import { GoogleGenAI } from '@google/generative-ai';
import { Recipe, MealPlan, Product, HealthMode, ChatMessage } from '../types';

// Get Gemini API Key from localStorage or Environment Variable
export const getGeminiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const hasGeminiKey = (): boolean => {
  const key = getGeminiKey();
  return key !== '' && key !== 'mock-key';
};

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  // Note: Standard JS SDK uses GoogleGenAI or @google/generative-ai
  // Depending on package, standard import is GoogleGenAI
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('Error creating GoogleGenAI client', e);
    return null;
  }
};

/**
 * 1. AI OCR Scanner (Vision)
 * Extracts product details from an uploaded image base64
 */
export const scanProductImage = async (
  imageBase64: string, // data:image/png;base64,...
  mimeType: string = 'image/jpeg'
): Promise<{
  name: string;
  brand: string;
  expiryDate: string;
  mfgDate?: string;
  barcode?: string;
  category: string;
  confidence: number;
  batch?: string;
  mrp?: number;
}> => {
  if (!hasGeminiKey()) {
    // Return High-fidelity Mock scanning result based on random time
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const randomItems = [
      { name: 'Organic Almond Milk', brand: 'Silk', category: 'Dairy', expOffset: 12, mrp: 4.99 },
      { name: 'Fresh Blueberries', brand: 'Driscoll\'s', category: 'Fruits', expOffset: 4, mrp: 3.49 },
      { name: 'Multivitamin Gummies', brand: 'Nature\'s Way', category: 'Supplements', expOffset: 180, mrp: 18.99 },
      { name: 'Tomato Ketchup', brand: 'Heinz', category: 'Snacks', expOffset: 90, mrp: 2.89 },
      { name: 'Paracetamol Tablets', brand: 'Tylenol', category: 'Medicine', expOffset: 365, mrp: 6.50 },
    ];
    const chosen = randomItems[Math.floor(Math.random() * randomItems.length)];
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + chosen.expOffset);
    
    return {
      name: chosen.name,
      brand: chosen.brand,
      expiryDate: expDate.toISOString().split('T')[0],
      mfgDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
      barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
      category: chosen.category,
      confidence: Math.floor(88 + Math.random() * 11),
      mrp: chosen.mrp,
      batch: 'B-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    };
  }

  try {
    const ai = getGeminiClient();
    if (!ai) throw new Error('Failed to create Gemini client');
    
    // Remove data:image/...;base64, prefix
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    
    // We use gemini-1.5-flash for speed and reliability in extraction
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: `Analyze this food or medicine product package. Extract the following details and return strictly as a JSON object matching this schema. If a value cannot be found, provide a best guess or empty string:
              {
                "name": "Product Name (clean, readable)",
                "brand": "Brand Name",
                "expiryDate": "YYYY-MM-DD (format the expiry date found, prioritising labels like EXP, Expiry, Use By, BBD)",
                "mfgDate": "YYYY-MM-DD (format manufacturing date, optional)",
                "barcode": "Barcode numbers if visible (optional)",
                "category": "Choose one: Medicine, Dairy, Vegetables, Fruits, Bakery, Snacks, Frozen Food, Beverages, Cosmetics, Baby Products, Supplements, Other",
                "confidence": 95, // estimation of text reading correctness as an integer percentage (0-100)
                "batch": "Batch or Lot number if visible (optional)",
                "mrp": 0.00 // MRP or price if visible (optional, number)
              }
              Return only the JSON object. Do not include markdown wraps or backticks.`
            }
          ]
        }
      ]
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Gemini OCR Error, falling back to mock:', error);
    throw error;
  }
};

/**
 * 2. AI Recipe Generator 2.0
 */
export const generateRecipesFromIngredients = async (
  availableIngredients: string[],
  expiringItems: string[],
  cuisine: string,
  healthGoal: HealthMode
): Promise<Recipe[]> => {
  const key = getGeminiKey();
  
  if (!hasGeminiKey()) {
    // Premium Mock Recipe Generator
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    const hasMilk = availableIngredients.some(i => i.toLowerCase().includes('milk'));
    const hasStrawberries = availableIngredients.some(i => i.toLowerCase().includes('strawberry') || i.toLowerCase().includes('strawberries'));
    const hasAvocados = availableIngredients.some(i => i.toLowerCase().includes('avocado'));
    const hasSpinach = availableIngredients.some(i => i.toLowerCase().includes('spinach'));
    const hasBread = availableIngredients.some(i => i.toLowerCase().includes('bread') || i.toLowerCase().includes('sourdough'));

    const mockRecipes: Recipe[] = [];

    if (hasMilk && hasStrawberries) {
      mockRecipes.push({
        id: 'r-mock-1',
        name: `🍓 Creamy Strawberry Milkshake (${healthGoal} Mode)`,
        cuisine: cuisine || 'Dessert',
        ingredients: [
          '2 cups Fresh Strawberries (expiring soon)',
          '1.5 cups Organic Whole Milk',
          '2 tbsp Honey or Maple Syrup',
          '1/2 cup Ice cubes',
          '1/2 tsp Vanilla extract'
        ],
        instructions: [
          'Wash the strawberries thoroughly and remove the green leafy hulls.',
          'Add strawberries, cold milk, sweetener, vanilla extract, and ice into a high-speed blender.',
          'Blend on high for 45-60 seconds until completely smooth and frothy.',
          'Pour into tall chilled glasses and garnish with a sliced strawberry. Serve immediately!'
        ],
        prepTime: 5,
        cookTime: 0,
        calories: 180,
        difficulty: 'Easy',
        nutrition: { protein: 4, carbs: 28, fat: 5, fiber: 3, sugar: 22, healthScore: 85 },
        substitutes: { 'Whole Milk': 'Almond milk, Oat milk, or Soy milk', 'Honey': 'Agave syrup or stevia for lower sugar' },
        tips: ['Freeze your strawberries for 30 minutes beforehand for an extra thick milkshake without needing ice cream.'],
        mistakes: ['Blending too long causes the blender motor to heat up, warming the milk and making the shake watery.'],
        storage: 'Best consumed immediately. Can be stored in the fridge for up to 12 hours, but shake well before drinking.',
        leftovers: 'Pour leftovers into popsicle molds and freeze for delicious Strawberry Milk Pops!',
        isFavorite: false,
        imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400'
      });
    }

    if (hasAvocados && hasBread) {
      mockRecipes.push({
        id: 'r-mock-2',
        name: `🥑 Premium Avocado Toast (${healthGoal} Mode)`,
        cuisine: cuisine || 'American',
        ingredients: [
          '2 slices Sourdough Bread',
          '1 ripe Hass Avocado',
          '1 tbsp Lemon juice',
          'Pinch of red pepper flakes',
          'Sea salt & black pepper to taste',
          'Optional: Handful of Baby Spinach for topping'
        ],
        instructions: [
          'Toast the sourdough bread slices to your desired level of crispiness.',
          'Cut the avocado in half, remove the pit, and scoop the flesh into a small bowl.',
          'Add lemon juice, sea salt, and black pepper. Mash gently with a fork, leaving some chunks for texture.',
          'Spread the mashed avocado evenly over the warm toasted bread.',
          'Garnish with baby spinach, red pepper flakes, and a light drizzle of olive oil. Serve immediately.'
        ],
        prepTime: 5,
        cookTime: 2,
        calories: 290,
        difficulty: 'Easy',
        nutrition: { protein: 7, carbs: 32, fat: 16, fiber: 8, sugar: 2, healthScore: 92 },
        substitutes: { 'Sourdough': 'Gluten-free bread or rye bread', 'Lemon juice': 'Lime juice or apple cider vinegar' },
        tips: ['Rub a cut garlic clove lightly over the warm toasted bread before spreading the avocado for a subtle garlicky kick.'],
        mistakes: ['Using an underripe avocado will yield a lumpy, bitter toast. Avocados should feel slightly soft when gently squeezed.'],
        storage: 'Avocado toast does not store well as the avocado will brown. Prepare only what you plan to eat immediately.',
        isFavorite: false,
        imageUrl: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=400'
      });
    }

    // Default Fallback Recipe
    mockRecipes.push({
      id: 'r-mock-3',
      name: `🥗 Smart Pantry Stir-Fry (${healthGoal} Mode)`,
      cuisine: cuisine || 'Asian',
      ingredients: availableIngredients.length > 0 
        ? availableIngredients.map(i => `1 cup of ${i}`)
        : ['1 cup Mixed Vegetables (Spinach, Avocados)', '1 tbsp Olive oil', '2 tbsp Soy Sauce', '1 clove Garlic'],
      instructions: [
        'Prep all ingredients by washing and chopping them into uniform bite-sized pieces.',
        'Heat olive oil in a large skillet or wok over medium-high heat.',
        'Add minced garlic and sauté for 30 seconds until fragrant.',
        'Add the ingredients (harder vegetables first, leafy greens like spinach at the very end). Sauté for 4-5 minutes.',
        'Drizzle soy sauce, toss well, and cook for 1 more minute. Serve hot!'
      ],
      prepTime: 10,
      cookTime: 7,
      calories: 140,
      difficulty: 'Easy',
      nutrition: { protein: 3, carbs: 12, fat: 8, fiber: 4, sugar: 3, healthScore: 89 },
      substitutes: { 'Olive oil': 'Sesame oil or coconut oil', 'Soy Sauce': 'Tamari or Coconut Aminos (low sodium)' },
      tips: ['Make sure the wok is very hot before adding ingredients to get a quick sear without making the veggies soggy.'],
      isFavorite: false,
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400'
    });

    return mockRecipes;
  }

  try {
    const ai = getGeminiClient();
    if (!ai) throw new Error('Failed to create Gemini client');

    const prompt = `You are a world-class professional chef and nutritionist. Generate 3 gourmet, healthy recipes that utilize the following ingredients. Priority ingredients to use (expiring soon): ${expiringItems.join(', ')}. Other available ingredients: ${availableIngredients.join(', ')}.
    Cuisine preference: ${cuisine || 'Any'}.
    Health/Diet Goal: ${healthGoal}.
    
    For each recipe, generate comprehensive fields. Output strictly as a JSON array of objects fitting this typescript interface:
    interface Recipe {
      name: string;
      cuisine: string;
      ingredients: string[]; // detailed with quantities
      instructions: string[]; // step-by-step
      prepTime: number; // minutes
      cookTime: number; // minutes
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
      substitutes?: { [ingredient: string]: string }; // alternative ingredients
      tips?: string[];
      mistakes?: string[]; // common cooking mistakes for this recipe
      storage?: string; // storage instructions
      leftovers?: string; // leftover usage ideas
      imageUrl?: string; // leave empty
    }
    
    Return ONLY the raw JSON array. No markdown, no backticks, no wrap text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const recipes: Recipe[] = JSON.parse(cleanText);
    
    // Attach query terms to unsplash query to make it beautiful
    return recipes.map((r, index) => ({
      ...r,
      id: `r-${Date.now()}-${index}`,
      isFavorite: false,
      imageUrl: `https://source.unsplash.com/400x300/?food,cooking,${encodeURIComponent(r.name.split(' ').slice(1, 3).join(','))}`
    }));
  } catch (error) {
    console.error('Gemini Recipe Gen Error:', error);
    throw error;
  }
};

/**
 * 3. AI Meal Planner (Full Day)
 */
export const generateDailyMealPlan = async (
  inventory: Product[],
  healthGoal: HealthMode,
  targetCalories: number = 2000
): Promise<MealPlan> => {
  const expiringNames = inventory
    .filter((p) => p.status === 'expiring')
    .map((p) => p.name);
  const otherNames = inventory
    .filter((p) => p.status === 'fresh')
    .map((p) => p.name);

  if (!hasGeminiKey()) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Provide a beautiful mock full-day meal plan
    return {
      date: new Date().toISOString().split('T')[0],
      breakfast: {
        id: 'mp-b',
        name: '🍳 High-Protein Avocado Scramble',
        cuisine: 'American',
        ingredients: ['3 Fresh Eggs', '1/2 Hass Avocado', '1 cup Baby Spinach', '1 tsp Butter', 'Salt and Pepper'],
        instructions: ['Beat eggs in a bowl. Heat butter in a pan.', 'Sauté spinach until wilted.', 'Pour eggs and scramble gently. Top with diced avocado and seasoning.'],
        prepTime: 5,
        cookTime: 5,
        calories: 380,
        difficulty: 'Easy',
        nutrition: { protein: 22, carbs: 6, fat: 28, fiber: 5, sugar: 1, healthScore: 90 },
        isFavorite: false
      },
      lunch: {
        id: 'mp-l',
        name: '🥗 Warm Spinach & Salmon Salad',
        cuisine: 'Mediterranean',
        ingredients: ['1 Salmon fillet', '2 cups Baby Spinach', '1 tbsp Olive oil', '1 tbsp Lemon juice', '5 Cherry tomatoes'],
        instructions: ['Pan-sear salmon fillet for 4 mins each side.', 'Toss baby spinach, cherry tomatoes, olive oil, and lemon juice in a bowl.', 'Flake salmon on top and serve.'],
        prepTime: 8,
        cookTime: 10,
        calories: 450,
        difficulty: 'Medium',
        nutrition: { protein: 34, carbs: 8, fat: 31, fiber: 3, sugar: 2, healthScore: 95 },
        isFavorite: false
      },
      dinner: {
        id: 'mp-d',
        name: '🍜 Simple Pantry Veggie Pasta',
        cuisine: 'Italian',
        ingredients: ['2 oz Whole Wheat Pasta', '1 cup Tomato Sauce', 'Mixed Veggies (Spinach, Mushrooms)', 'Parmesan Cheese'],
        instructions: ['Boil pasta. Sauté veggies in oil.', 'Add tomato sauce to veggies, simmer for 3 mins.', 'Drain pasta, toss in sauce, top with cheese.'],
        prepTime: 10,
        cookTime: 12,
        calories: 520,
        difficulty: 'Easy',
        nutrition: { protein: 15, carbs: 75, fat: 12, fiber: 9, sugar: 8, healthScore: 82 },
        isFavorite: false
      },
      snacks: {
        id: 'mp-s',
        name: '🍓 Strawberry Yogurt Bowl',
        cuisine: 'Healthy',
        ingredients: ['1 cup Greek Yogurt', '1/2 cup Strawberries', '1 tbsp Honey', '1 tbsp Chia Seeds'],
        instructions: ['Scoop yogurt into a bowl.', 'Top with sliced strawberries, chia seeds, and drizzle honey.'],
        prepTime: 3,
        cookTime: 0,
        calories: 210,
        difficulty: 'Easy',
        nutrition: { protein: 18, carbs: 24, fat: 3, fiber: 4, sugar: 16, healthScore: 94 },
        isFavorite: false
      },
      shoppingSuggestions: ['Cherry tomatoes', 'Parmesan Cheese', 'Chia Seeds', 'Eggs']
    };
  }

  try {
    const ai = getGeminiClient();
    if (!ai) throw new Error('Failed to create Gemini client');

    const prompt = `You are a culinary planner. Create a single-day meal plan (breakfast, lunch, dinner, and one snack) matching a total of approximately ${targetCalories} calories.
    Health Goal Profile: ${healthGoal}.
    Use these expiring inventory products: ${expiringNames.join(', ')}.
    And incorporate these fresh products: ${otherNames.join(', ')}.

    Output strictly as a JSON object matching this schema (do not wrap in markdown):
    {
      "breakfast": {
        "name": "Breakfast name",
        "ingredients": ["item 1", "item 2"],
        "instructions": ["step 1"],
        "prepTime": 5,
        "cookTime": 10,
        "calories": 400,
        "nutrition": { "protein": 20, "carbs": 30, "fat": 15, "fiber": 5, "sugar": 5, "healthScore": 90 }
      },
      "lunch": { ... },
      "dinner": { ... },
      "snacks": { ... },
      "shoppingSuggestions": ["needed ingredient 1", "needed ingredient 2"]
    }
    Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);
    
    return {
      date: new Date().toISOString().split('T')[0],
      breakfast: { ...data.breakfast, id: `mp-b-${Date.now()}`, cuisine: 'Any', isFavorite: false },
      lunch: { ...data.lunch, id: `mp-l-${Date.now()}`, cuisine: 'Any', isFavorite: false },
      dinner: { ...data.dinner, id: `mp-d-${Date.now()}`, cuisine: 'Any', isFavorite: false },
      snacks: { ...data.snacks, id: `mp-s-${Date.now()}`, cuisine: 'Any', isFavorite: false },
      shoppingSuggestions: data.shoppingSuggestions || []
    };
  } catch (error) {
    console.error('Gemini Meal Plan Error:', error);
    throw error;
  }
};

/**
 * 4. AI Recipe Chat Assistant (Conversational)
 */
export const chatWithKitchenAssistant = async (
  message: string,
  history: ChatMessage[],
  inventory: Product[]
): Promise<string> => {
  const response = await fetch('/api/recipe-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      inventory: inventory.map(p => ({ name: p.name, expiryDate: p.expiryDate }))
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Unable to contact Gemini AI.");
  }

  const data = await response.json();
  return data.response;
};
