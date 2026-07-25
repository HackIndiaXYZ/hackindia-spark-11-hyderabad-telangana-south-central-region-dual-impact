# Smart Expiry Scanner AI - AI Smart Kitchen Ecosystem 🍳🤖

A premium, production-ready, AI-powered food and medicine expiry management ecosystem that helps users scan, track, schedule notifications, and cook recipes using expiring items.

Built with a glassmorphic design system inspired by Apple, Notion, and Linear.

---

## 🚀 Architectural Stack
- **Framework**: React 19 (Strict TypeScript) + Vite 8
- **Styling**: Tailwind CSS v4 (Glassmorphic cards, custom layouts, blurs)
- **Animations**: Framer Motion (premium Apple-level UI feedback transitions)
- **Icons**: Lucide React
- **Charts**: Recharts (Monthly waste line graphs, category distribution pies, consumed-to-discarded bars)
- **AI Core**: Google Gemini model (OCR vision parsing, Chatbot, Recipe generator, Meal Planner)
- **Barcode Database**: OpenFoodFacts API integration
- **Voice System**: Web Speech API (`webkitSpeechRecognition` & `speechSynthesis` voice instructions)
- **Authentication**: Firebase Authentication + Local Mock mode fallback
- **Offline / Sync**: LocalStorage automated sync pipeline for full PWA compatibility

---

## 💎 Features Overview

1. **AI Smart Pantry**: Products are cataloged inside visual shelves based on storage zones (Refrigerator, Freezer, Dry Pantry, Medicine Cabinet, Kitchen Shelf, Bathroom).
2. **AI Waste Predictor**: Formulates a "Waste Risk Score" checking upcoming expirations and logs potential money wasted.
3. **AI Meal Planner**: Sets up breakfast, lunch, dinner, and snack routines matching calorie targets and health needs.
4. **AI Grocery Assistant**: Suggests restocking items as they are marked consumed, calculating cost estimators.
5. **AI Nutrition Analyzer**: Displays protein, carbs, fiber, sugar, sodium, and health indices for generated recipes.
6. **AI Health Mode**: Feeds fitness diets (Gym/High Protein, Weight Loss, Diabetic, Heart Healthy) into Chef AI prompts.
7. **AI Cooking Assistant**: Next/Back step companion reading directions aloud via speech synthesis, with built-in timers.
8. **AI Chat Assistant**: Conversational ChatGPT-style advisor answering shelf-life questions ("Can I freeze strawberries?").
9. **AI Barcode Intelligence**: Searches OpenFoodFacts barcodes to extract ingredients, allergens, and countries.
10. **AI OCR Adjustments**: Displays preview forms showing scanner confidence ratings, allowing manual corrections.
11. **AI Product Timeline**: Plots chronological logs (Added On -> Opened On -> Expiry) for item lifecycles.
12. **Smart Calendar**: Monthly calendar grid highlighted with indicator rings showing items expiring on specific days.
13. **Smart Notifications**: Schedules desktop alerts for items expiring within 7 days, 3 days, 1 day, or day of.
14. **Cookbook Favorites**: Bookmark recipes, list cooked logs, and recall recently completed meals.
15. **Family Sharing Invite**: Manage lists of household profiles and view recent pantry log history feeds.
16. **Offline Sync PWA**: Stays 100% functional without internet connectivity, storing files locally.

---

## 📂 Code Layout
```
/src
  /assets         - CSS, SVG assets
  /components     - Reusable widgets (GlassCard, VoiceAssistant, Timer, etc.)
  /context        - AuthContext, ThemeContext, PantryContext state managers
  /pages          - Login, Dashboard, DigitalPantry, AddProduct, Details, RecipeBook, Chat, Analytics, Calendar, Settings
  /services       - firebase.ts, gemini.ts, openFoodFacts.ts, notifications.ts
  /types          - index.ts (TypeScript interface models)
```

---

## 🛠️ Local Setup and Run

### 1. Clone & Install
```bash
# Navigate to project folder
cd "expiry gpt"

# Install all packages
npm install
```

### 2. Configure Environment variables
Rename `.env.example` to `.env` and insert your Firebase credentials and Gemini API Key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
...
```
*Note: If no API key is specified, the application will automatically fall back to high-fidelity, interactive **Mock Mode** so all screens stay 100% testable out-of-the-box.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Production Bundle
To build static production files (ideal for PWA hostings):
```bash
npm run build
```

---

## 🌐 Deployment Guide
This static React app can be deployed to any hosting service:
1. **Firebase Hosting**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   # Set build folder to 'dist'
   npm run build
   firebase deploy
   ```
2. **Vercel / Netlify / GitHub Pages**:
   Connect the Git repository and set the build command to `npm run build` and output directory to `dist`.
