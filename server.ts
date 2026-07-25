import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Helper for Gemini AI client initialization
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // OCR Scan API (Extracts Expiry Date, Manufacturing Date, Product Name, Brand, Barcode, etc.)
  app.post('/api/ocr-scan', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing imageBase64 in request body' });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const ai = getGeminiClient();

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      };

      const promptText = `Analyze this product packaging image carefully.
Extract any text related to:
1. Product Name
2. Brand or Manufacturer
3. Expiry Date or Best Before Date (Convert to YYYY-MM-DD format if possible, e.g. "2026-03-30")
4. Manufacturing Date (MFD or PKD) (Convert to YYYY-MM-DD format if possible)
5. Barcode number (digits)
6. Batch Number / Lot Number
7. MRP or Price (e.g. $4.50 or Rs 150)
8. Product Category (Select one: Medicine, Dairy, Vegetables, Fruits, Bakery, Snacks, Frozen Food, Beverages, Cosmetics, Baby Products, Supplements, Other)
9. Your overall Confidence Score (0.0 to 1.0)
10. Raw detected text summary.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config: {
          systemInstruction: 'You are an expert OCR vision scanner for food, dairy, medicine, and retail products. Always accurately identify expiry dates, manufacturing dates, and product details.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING, description: 'Detected name of product' },
              brand: { type: Type.STRING, description: 'Brand or manufacturer' },
              expiryDate: { type: Type.STRING, description: 'Expiry date in YYYY-MM-DD format' },
              mfdDate: { type: Type.STRING, description: 'Manufacturing date in YYYY-MM-DD format' },
              barcode: { type: Type.STRING, description: 'Barcode numerical digits' },
              batchNumber: { type: Type.STRING, description: 'Batch or Lot number' },
              mrp: { type: Type.STRING, description: 'Retail price or MRP' },
              category: { 
                type: Type.STRING, 
                enum: ['Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other'] 
              },
              confidenceScore: { type: Type.NUMBER, description: 'Score between 0 and 1' },
              rawText: { type: Type.STRING, description: 'Full text found on package' },
            },
            required: ['productName', 'expiryDate'],
          },
        },
      });

      const resultText = response.text || '{}';
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/ocr-scan:', err);
      return res.status(500).json({ 
        error: 'OCR scanning failed', 
        message: err.message || 'Server error during scanning' 
      });
    }
  });

  // OpenFoodFacts Proxy Endpoint
  app.get('/api/openfoodfacts/:barcode', async (req, res) => {
    try {
      const { barcode } = req.params;
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SmartExpiryScannerAI/1.0 (contact@smartexpiry.app)',
        },
      });

      if (!response.ok) {
        return res.status(404).json({ error: 'Product barcode not found' });
      }

      const data = await response.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        return res.json({
          productName: p.product_name || p.product_name_en || 'Unknown Product',
          brand: p.brands || p.brand_owner || '',
          category: mapOpenFoodFactsCategory(p.categories_tags || []),
          imageUrl: p.image_url || p.image_front_url || '',
          ingredients: p.ingredients_text || '',
        });
      } else {
        return res.status(404).json({ error: 'Barcode product not found in OpenFoodFacts database' });
      }
    } catch (err: any) {
      console.error('Error in /api/openfoodfacts:', err);
      return res.status(500).json({ error: 'Failed to query barcode database' });
    }
  });

  // AI Recipe Generator Endpoint
  app.post('/api/generate-recipes', async (req, res) => {
    try {
      const { products, preferences, prompt } = req.body;
      const ai = getGeminiClient();

      const itemsList = Array.isArray(products) && products.length > 0
        ? products.map(p => `- ${p.name} (${p.category}, expires in ${p.daysRemaining ?? 'few'} days)`).join('\n')
        : '- Milk\n- Eggs\n- Strawberries\n- Bread';

      const userInstruction = prompt || `Generate 3 creative, appetizing, and step-by-step recipes specifically prioritizing items expiring soon!
Dietary preference: ${preferences || 'None'}.
Make sure ingredients specify whether they come from the user's expiring inventory.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Available Inventory:\n${itemsList}\n\nTask: ${userInstruction}`,
        config: {
          systemInstruction: 'You are an executive chef AI specializing in zero-waste cooking. Generate creative, delicious, easy-to-follow recipes utilizing pantry items before they expire.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                emoji: { type: Type.STRING },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                prepTime: { type: Type.STRING },
                cookTime: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                servings: { type: Type.INTEGER },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING },
                      amount: { type: Type.STRING },
                      isFromInventory: { type: Type.BOOLEAN },
                    },
                    required: ['item', 'amount'],
                  },
                },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                nutrition: {
                  type: Type.OBJECT,
                  properties: {
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fat: { type: Type.STRING },
                    fiber: { type: Type.STRING },
                  },
                  required: ['protein', 'carbs', 'fat'],
                },
                tips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                storageInstructions: { type: Type.STRING },
              },
              required: ['id', 'title', 'emoji', 'description', 'ingredients', 'instructions', 'nutrition'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      return res.json({ recipes: parsed });
    } catch (err: any) {
      console.error('Error in /api/generate-recipes:', err);
      return res.status(500).json({ error: 'Recipe generation failed', message: err.message });
    }
  });

  // AI Recipe Chat Endpoint
  app.post('/api/recipe-chat', async (req, res) => {
    try {
      const { message, inventory } = req.body;
      const ai = getGeminiClient();

      const inventoryContext = Array.isArray(inventory) && inventory.length > 0
        ? `User's current inventory: ${inventory.map(i => `${i.name} (${i.expiryDate})`).join(', ')}`
        : 'User inventory available.';

      const promptText = `${inventoryContext}\nUser prompt: "${message}"\nProvide a warm, helpful chef response. If relevant, include a complete recipe structure in JSON format at the end wrapped in \`\`\`json ... \`\`\`.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          systemInstruction: 'You are Chef Gemini, a friendly culinary AI assistant. You give expert cooking advice, recipe suggestions, substitute recommendations, and zero-waste tips based on available ingredients.',
        },
      });

      return res.json({ response: response.text });
    } catch (err: any) {
      console.error('Error in /api/recipe-chat:', err);
      return res.status(500).json({ error: 'Recipe chat failed', message: err.message });
    }
  });

  // --- VITE / STATIC MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

function mapOpenFoodFactsCategory(tags: string[]): any {
  const str = tags.join(' ').toLowerCase();
  if (str.includes('dairy') || str.includes('milk') || str.includes('cheese') || str.includes('yogurt')) return 'Dairy';
  if (str.includes('beverage') || str.includes('drink') || str.includes('juice') || str.includes('soda')) return 'Beverages';
  if (str.includes('snack') || str.includes('biscuit') || str.includes('chip') || str.includes('cookie')) return 'Snacks';
  if (str.includes('bakery') || str.includes('bread') || str.includes('pastry')) return 'Bakery';
  if (str.includes('fruit')) return 'Fruits';
  if (str.includes('vegetable')) return 'Vegetables';
  if (str.includes('frozen')) return 'Frozen Food';
  if (str.includes('baby')) return 'Baby Products';
  if (str.includes('cosmetics') || str.includes('beauty')) return 'Cosmetics';
  if (str.includes('supplement') || str.includes('vitamin')) return 'Supplements';
  return 'Other';
}

startServer();
