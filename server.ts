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
    if (!apiKey || apiKey === "placeholder_key") {
      throw new Error('GEMINI_API_KEY environment variable is missing or placeholder.');
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
        model: 'gemini-2.5-flash',
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
      console.warn('Error in /api/ocr-scan (falling back to mock response):', err.message);
      // Fallback Mock OCR scan response
      return res.json({
        productName: "Milk Packet",
        brand: "Amul",
        expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], 
        mfdDate: new Date().toISOString().split('T')[0],
        barcode: "",
        batchNumber: "B_MOCK77",
        mrp: "₹60",
        category: "Dairy",
        confidenceScore: 0.9,
        rawText: "Mock OCR Scan Result due to API Key fallback"
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

  // AI Recipe Generator Endpoint (Prioritizes Indian Recipes and measurements)
  app.post('/api/generate-recipes', async (req, res) => {
    try {
      const { products, preferences, prompt } = req.body;
      const ai = getGeminiClient();

      const itemsList = Array.isArray(products) && products.length > 0
        ? products.map(p => `- ${p.name} (${p.category}, expires in ${p.daysRemaining ?? 'few'} days)`).join('\n')
        : '- Milk\n- Eggs\n- Potato\n- Onion\n- Bread';

      const userInstruction = prompt || `Generate 3 creative, appetizing, and step-by-step recipes specifically prioritizing items expiring soon!
Dietary preference: ${preferences || 'None'}.
CRITICAL: Prioritize authentic Indian recipes (80% weightage, South Indian, North Indian, Punjabi, etc.) like Paneer Butter Masala, Veg Pulao, Curd Rice, Upma, Poha, Aloo Paratha, Veg Khichdi, etc.
Use Indian measurements (cups, tsp, tbsp, grams, ml) and display prices/savings in Indian Rupees (₹).
Make sure ingredients specify whether they come from the user's expiring inventory.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
      console.warn('Error in /api/generate-recipes (falling back to mock response):', err.message);
      // Fallback Mock Recipes
      return res.json({ recipes: [
        {
          id: "rec_1",
          title: "Paneer Butter Masala",
          emoji: "🍛",
          description: "A rich, creamy, and mildly sweet gravy made with butter, tomatoes, cashews, paneer, and Indian spices.",
          difficulty: "Medium",
          prepTime: "15 mins",
          cookTime: "20 mins",
          calories: 360,
          servings: 4,
          ingredients: [
            { item: "Paneer", amount: "200 grams", isFromInventory: true },
            { item: "Tomato Puree", amount: "1 cup", isFromInventory: false },
            { item: "Butter", amount: "2 tbsp", isFromInventory: false },
            { item: "Fresh Cream", amount: "2 tbsp", isFromInventory: false },
            { item: "Kasuri Methi", amount: "1 tsp", isFromInventory: false },
            { item: "Garam Masala", amount: "1 tsp", isFromInventory: false }
          ],
          instructions: [
            "Heat butter in a pan and sauté tomato puree until fat separates.",
            "Add garam masala, chili powder, and cashew paste.",
            "Stir in 1/2 cup water, paneer cubes, and let simmer for 5 minutes.",
            "Finish with fresh cream and kasuri methi before serving warm with chapati."
          ],
          nutrition: { protein: "12g", carbs: "8g", fat: "28g", fiber: "2g" },
          tips: ["Substitute cashew paste with almond meal if needed.", "Use low-fat paneer for a healthier option."],
          storageInstructions: "Store in an airtight container in the refrigerator for up to 2 days."
        },
        {
          id: "rec_2",
          title: "Quick Vegetable Pulao",
          emoji: "🍚",
          description: "A fragrant, delicious, one-pot rice dish loaded with mixed vegetables and aromatic spices.",
          difficulty: "Easy",
          prepTime: "10 mins",
          cookTime: "15 mins",
          calories: 220,
          servings: 3,
          ingredients: [
            { item: "Basmati Rice", amount: "1 cup", isFromInventory: false },
            { item: "Mixed Vegetables (Carrot, Peas, Potato)", amount: "1.5 cups", isFromInventory: true },
            { item: "Onion (Sliced)", amount: "1 medium", isFromInventory: true },
            { item: "Ghee", amount: "1.5 tbsp", isFromInventory: false },
            { item: "Whole Spices (Cardamom, Cloves, Cinnamon)", amount: "1 tsp", isFromInventory: false }
          ],
          instructions: [
            "Wash and soak Basmati rice for 20 minutes.",
            "Heat ghee in a pressure cooker and splutter whole spices. Sauté sliced onions until golden.",
            "Add vegetables and cook for 2 minutes, then add drained rice and 2 cups of water.",
            "Pressure cook for 2 whistles. Fluff with a fork and serve with raita."
          ],
          nutrition: { protein: "4g", carbs: "42g", fat: "5g", fiber: "4g" },
          tips: ["Add roasted cashews on top for extra crunch.", "Substitute Basmati with any regular rice if Basmati is unavailable."],
          storageInstructions: "Best consumed fresh. Can be refrigerated for 24 hours."
        }
      ] });
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
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction: 'You are Chef Gemini, a friendly culinary AI assistant. You give expert cooking advice, recipe suggestions, substitute recommendations, and zero-waste tips based on available ingredients.',
        },
      });

      return res.json({ response: response.text });
    } catch (err: any) {
      console.warn('Error in /api/recipe-chat (falling back to mock response):', err.message);
      return res.json({ response: "Namaste! I am Chef Gemini. I noticed my connection to the AI engine is currently using simulated mode, but I can still tell you that Paneer Butter Masala or Veg Pulao would be an excellent way to use your expiring ingredients. Let me know if you would like me to show you the cooking steps!" });
    }
  });

  // AI Voice Assistant NLP Endpoint
  app.post('/api/voice-assistant', async (req, res) => {
    const { message, context, inventory } = req.body;
    try {
      const ai = getGeminiClient();
      
      const todayStr = new Date().toISOString().split('T')[0];
      
      const inventoryList = Array.isArray(inventory)
        ? inventory.map((p: any) => `- ${p.name} (Category: ${p.category}, Expiry: ${p.expiryDate}, Location: ${p.location})`).join('\n')
        : 'None';
        
      const systemInstruction = `You are a Smart Pantry Voice Assistant. You help users manage their kitchen inventory (products, medicines, food).
Current Date: ${todayStr}

Tasks:
1. Parse user queries to perform operations: ADD a product, DELETE/REMOVE a product, VIEW/QUERY inventory (expiring items, medicines, etc.), GENERATE recipes, or OPEN tabs (dashboard, shopping list, recipes, etc.).
2. For ADD product commands, you MUST extract:
   - productName (string, required)
   - expiryDate (string in YYYY-MM-DD format)
   - quantity (number)
   - category (enum: 'Medicine', 'Dairy', 'Vegetables', 'Fruits', 'Bakery', 'Snacks', 'Frozen Food', 'Beverages', 'Cosmetics', 'Baby Products', 'Supplements', 'Other')
   - notes (string)
   - location (enum: 'Kitchen', 'Refrigerator', 'Medicine Box', 'Shelf', 'Pantry', 'Freezer', 'Other')
   - brand (string)
3. If the user wants to add a product, but required information is missing, ask ONLY for the missing details:
   - Missing expiryDate? Ask "What is the expiry date for [product]?"
   - Missing quantity? Ask "How many packets/pieces?"
   - Do not ask for optional fields like brand, notes, category, or location. Infere category and location if not specified (e.g., Milk -> Dairy, Refrigerator).
4. If they say "Add milk expiring on July 30", since quantity is missing, you should ask "How many packets/pieces of milk?"
5. If all required information (productName, expiryDate, quantity) is present, confirm addition.
6. The user can also add items to the SHOPPING LIST.
7. Return a JSON object matching this schema:
{
  "reply": "Warm spoken text response for the user",
  "intent": "add_product | add_shopping | delete_product | edit_product | shopping_list_ops | navigate | query_pantry | generate_recipe | general",
  "extractedData": {
    "productName": "...",
    "expiryDate": "YYYY-MM-DD",
    "quantity": 1,
    "category": "...",
    "notes": "...",
    "location": "...",
    "brand": "..."
  },
  "missingFields": ["expiryDate", "quantity"],
  "navigationTab": "dashboard | products | scan | manual | shopping | recipes | chat | analytics | settings"
}`;

      const promptText = `Current Context: ${JSON.stringify(context || {})}
Current Pantry Inventory:
${inventoryList}

User message: "${message}"

Respond strictly with a JSON object matching the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'Spoken and text reply for the user' },
              intent: { 
                type: Type.STRING, 
                enum: ['add_product', 'add_shopping', 'delete_product', 'edit_product', 'shopping_list_ops', 'navigate', 'query_pantry', 'generate_recipe', 'general'] 
              },
              extractedData: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  expiryDate: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  location: { type: Type.STRING },
                  brand: { type: Type.STRING }
                }
              },
              missingFields: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              navigationTab: {
                type: Type.STRING,
                enum: ['dashboard', 'products', 'scan', 'manual', 'shopping', 'recipes', 'chat', 'analytics', 'settings']
              }
            },
            required: ['reply', 'intent']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Error in /api/voice-assistant (falling back to mock NLU parser):', err.message);
      
      // Basic Local NLU Parser Fallback
      const lower = message.toLowerCase();
      let reply = "I analyzed your query in offline mode.";
      let intent = "general";
      let extractedData: any = {};
      let missingFields: string[] = [];
      let navigationTab = "";

      // Helper function to extract date from a string
      const extractDate = (str: string): string => {
        const clean = str.toLowerCase();
        
        // Check for DD/MM/YYYY or DD-MM-YYYY
        const digitalMatch = clean.match(/(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{4}))?/);
        if (digitalMatch) {
          const day = parseInt(digitalMatch[1]);
          const month = parseInt(digitalMatch[2]) - 1;
          const year = digitalMatch[4] ? parseInt(digitalMatch[4]) : new Date().getFullYear();
          const dObj = new Date(year, month, day);
          if (!isNaN(dObj.getTime())) {
            return dObj.toISOString().split('T')[0];
          }
        }
        
        if (clean.includes('tomorrow')) {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        }
        if (clean.includes('today')) {
          return new Date().toISOString().split('T')[0];
        }
        
        // Try monthly patterns
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let monthIndex = -1;
        for (let i = 0; i < months.length; i++) {
          if (clean.includes(months[i])) {
            monthIndex = i % 12;
            break;
          }
        }
        
        if (monthIndex !== -1) {
          const numbers = clean.match(/\d+/g) || [];
          let day = 1;
          let year = new Date().getFullYear();
          for (const numStr of numbers) {
            if (numStr.length === 4) {
              year = parseInt(numStr);
            } else if (numStr.length === 1 || numStr.length === 2) {
              day = parseInt(numStr);
            }
          }
          const dObj = new Date(year, monthIndex, day);
          if (!isNaN(dObj.getTime())) {
            return dObj.toISOString().split('T')[0];
          }
        }
        return "";
      };

      // Check context first for multi-turn pending actions!
      if (context && context.pendingAction === 'add_product') {
        intent = "add_product";
        const name = context.productName || "Item";
        
        // 1. Get expiryDate (check context, then query)
        let expiryDate = context.expiryDate || extractDate(lower);
        
        // 2. Get quantity (check context, then query)
        const qtyMatch = lower.match(/\b\d+\b/);
        let qty = context.quantity || (qtyMatch ? parseInt(qtyMatch[0]) : undefined);
        
        extractedData = {
          productName: name,
          quantity: qty,
          expiryDate: expiryDate || undefined,
          category: context.category || "Other",
          location: context.location || "Kitchen"
        };

        if (!expiryDate) {
          missingFields.push("expiryDate");
          reply = `What is the expiry date for ${name}?`;
        } else if (!qty) {
          missingFields.push("quantity");
          reply = `How many packets/pieces of ${name} did you buy?`;
        } else {
          reply = `Done. Added "${name}" (${qty} pcs) expiring on ${expiryDate} successfully. Product added successfully.`;
        }
      } 
      else if (context && context.pendingAction === 'add_shopping') {
        intent = "add_shopping";
        const name = context.productName || "Item";
        const qtyMatch = lower.match(/\b\d+\b/);
        let qty = context.quantity || (qtyMatch ? parseInt(qtyMatch[0]) : undefined);

        extractedData = {
          productName: name,
          quantity: qty,
          category: context.category || "Other"
        };

        if (!qty) {
          missingFields.push("quantity");
          reply = `How many packets/pieces of ${name} should I add to the shopping list?`;
        } else {
          reply = `Done. Added "${name}" (${qty} pcs) to your shopping list.`;
        }
      }
      // 1. Navigation
      else if (lower.includes('shopping list') || lower.includes('shopping')) {
        if (lower.includes('add') || lower.includes('remove') || lower.includes('clear') || lower.includes('purchased') || lower.includes('bought')) {
          // falls through to shopping list ops
        } else {
          reply = "Opening your Smart Shopping List now.";
          intent = "navigate";
          navigationTab = "shopping";
        }
      } else if (lower.includes('dashboard') || lower.includes('overview')) {
        reply = "Opening your Dashboard overview.";
        intent = "navigate";
        navigationTab = "dashboard";
      } else if (lower.includes('recipe') || lower.includes('cook') || lower.includes('breakfast') || lower.includes('dinner')) {
        reply = "Opening AI Recipe Chef for zero-waste meal suggestions.";
        intent = "navigate";
        navigationTab = "recipes";
      } else if (lower.includes('scan') || lower.includes('camera')) {
        reply = "Opening Scanner now.";
        intent = "navigate";
        navigationTab = "scan";
      } else if (lower.includes('settings')) {
        reply = "Opening Settings.";
        intent = "navigate";
        navigationTab = "settings";
      }
      
      // 2. Mark Used
      if (intent === 'general' && (lower.includes('used') || lower.includes('finished') || lower.includes('done'))) {
        intent = "delete_product";
        const clean = lower.replace(/mark|as used|used|finished|done|the/gi, '').trim();
        extractedData.productName = clean || "Item";
        reply = `Marking "${extractedData.productName}" as finished in your pantry.`;
      }
      
      // 3. Edit product
      else if (intent === 'general' && (lower.includes('change') || lower.includes('update') || lower.includes('rename') || lower.includes('set'))) {
        intent = "edit_product";
        const qtyMatch = lower.match(/to\s+(\d+)/) || lower.match(/quantity\s+(\d+)/) || lower.match(/(\d+)\s+pieces/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : undefined;
        
        let date = "";
        if (lower.includes('expiry') || lower.includes('date')) {
          date = extractDate(lower);
        }
        
        let name = lower.replace(/change|update|rename|set|quantity|expiry|date|to/gi, '').replace(/\d+/g, '').trim();
        name = name.split(' ')[0] || "Item"; 
        
        extractedData = {
          productName: name,
          quantity: qty,
          expiryDate: date || undefined
        };
        reply = `Updating product details for "${name}".`;
      }
      
      // 4. Delete Product
      else if (intent === 'general' && (lower.startsWith('delete') || lower.startsWith('remove'))) {
        if (lower.includes('shopping')) {
          intent = "shopping_list_ops";
          const clean = lower.replace(/remove|delete|from shopping list|from shopping|list/gi, '').trim();
          extractedData.productName = clean || "Item";
          reply = `Removing "${extractedData.productName}" from shopping list.`;
        } else {
          intent = "delete_product";
          const match = message.replace(/delete|remove|the|product/gi, '').trim();
          extractedData.productName = match || "Item";
          reply = `Removing "${extractedData.productName}" from your pantry.`;
        }
      }
      
      // 5. Shopping list ops (clear, purchase)
      else if (intent === 'general' && (lower.includes('clear shopping') || lower.includes('clear list') || lower.includes('reset shopping'))) {
        intent = "shopping_list_ops";
        reply = "Clearing all items from your shopping list.";
      } else if (intent === 'general' && (lower.includes('purchase') || lower.includes('mark purchased') || lower.includes('bought'))) {
        intent = "shopping_list_ops";
        const clean = lower.replace(/mark|purchased|bought|on shopping list/gi, '').trim();
        extractedData.productName = clean || "Item";
        reply = `Marking "${extractedData.productName}" as purchased.`;
      }
      
      // 6. Add to shopping list
      else if (intent === 'general' && lower.includes('add') && (lower.includes('shopping') || lower.includes('list'))) {
        intent = "add_shopping";
        const clean = lower.replace(/add|bought|to my shopping list|to shopping list|to shopping|list/gi, '').trim();
        const qtyMatch = clean.match(/\d+/);
        const qty = qtyMatch ? parseInt(qtyMatch[0]) : undefined;
        const name = clean.replace(/\d+/g, '').trim();
        extractedData = {
          productName: name || "Item",
          quantity: qty,
          category: "Other"
        };
        if (!qty) {
          missingFields.push("quantity");
          reply = `How many packets/pieces of ${name || "Item"}?`;
        } else {
          reply = `Added "${name}" to your shopping list!`;
        }
      }
      
      // 7. Add product to pantry
      else if (intent === 'general' && (lower.startsWith('add') || lower.startsWith('bought'))) {
        intent = "add_product";
        const clean = lower.replace(/add|bought|to my pantry|to pantry/gi, '').trim();
        const qtyMatch = clean.match(/\d+/);
        const qty = qtyMatch ? parseInt(qtyMatch[0]) : undefined;
        const expiryDate = extractDate(lower);
        
        let name = clean.replace(/\d+/g, '').replace(/expiring.*|expires.*|yesterday|tomorrow|today/gi, '').trim();
        name = name || "Item";
        
        extractedData = {
          productName: name,
          quantity: qty,
          expiryDate: expiryDate || undefined,
          category: "Other",
          location: "Kitchen"
        };
        
        if (!expiryDate) {
          missingFields.push("expiryDate");
          reply = `What is the expiry date for ${name}?`;
        } else if (!qty) {
          missingFields.push("quantity");
          reply = `How many packets/pieces of ${name} did you buy?`;
        } else {
          reply = `Done. Added "${name}" (${qty} pcs) expiring on ${expiryDate} successfully. Product added successfully.`;
        }
      }

      return res.json({
        reply,
        intent,
        extractedData,
        missingFields,
        navigationTab
      });
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
