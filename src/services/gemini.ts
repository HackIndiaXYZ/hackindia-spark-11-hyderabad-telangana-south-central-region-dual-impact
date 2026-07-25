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
  const apiKey = getGeminiKey();
  if (!apiKey || apiKey === 'mock-key') {
    throw new Error('Unable to contact Gemini AI. Please configure your API key in Settings.');
  }

  try {
    const ai = getGeminiClient();
    if (!ai) throw new Error('Unable to contact Gemini AI. Client initialization failed.');
    
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
    console.error('Gemini OCR Error:', error);
    throw new Error('Unable to contact Gemini AI.');
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
  const apiKey = getGeminiKey();
  if (!apiKey || apiKey === 'mock-key') {
    throw new Error('Unable to contact Gemini AI. Please configure your API key in Settings.');
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

  const apiKey = getGeminiKey();
  if (!apiKey || apiKey === 'mock-key') {
    throw new Error('Unable to contact Gemini AI. Please configure your API key in Settings.');
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
