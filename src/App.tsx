import React, { useState, useEffect } from 'react';
import { 
  Sidebar, 
  Navbar, 
  DashboardStats, 
  ProductCard, 
  ScanModal, 
  CameraScannerModal, 
  UploadScannerModal, 
  BarcodeScannerModal, 
  AddProductModal, 
  ProductDetailsModal, 
  AiRecipeView, 
  AiChatView, 
  AnalyticsView, 
  SettingsModal, 
  AuthModal,
  ShoppingListView,
  AddToShoppingPromptModal,
  VoiceAssistantModal
} from './components';
import { 
  Product, 
  User, 
  UserPreferences, 
  Recipe, 
  ProductCategory, 
  ProductLocation,
  ShoppingItem
} from './types';
import { 
  loadProducts, 
  saveProducts, 
  loadPreferences, 
  savePreferences, 
  getInitialDemoData,
  loadShoppingItems,
  saveShoppingItems
} from './utils/storage';
import { 
  getExpiryStatus, 
  getDaysUntilExpiry 
} from './utils/dateUtils';
import { 
  AppNotification, 
  generateExpiryNotifications, 
  requestNotificationPermission 
} from './services/notificationService';
import { Plus, Filter, Calendar, Sparkles, SlidersHorizontal, Trash2, Mic } from 'lucide-react';

export function App() {
  // App views
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'scan' | 'manual' | 'shopping' | 'recipes' | 'chat' | 'analytics' | 'settings'>('dashboard');


  // Scanning method sub-views: 'select' | 'camera' | 'upload' | 'barcode'
  const [scanMethod, setScanMethod] = useState<'select' | 'camera' | 'upload' | 'barcode'>('select');

  // Core domain data
  const [products, setProducts] = useState<Product[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [user, setUser] = useState<User>({
    uid: 'guest_123',
    email: 'guest@smartexpiry.ai',
    displayName: 'Guest User',
    isGuest: true,
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    enableBrowserNotifications: true,
    reminderDays: [7, 3, 2, 1, 0],
    dietaryPreference: 'None',
    currency: '$',
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'expiryAsc' | 'expiryDesc' | 'name' | 'added'>('expiryAsc');

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [focusProductForRecipe, setFocusProductForRecipe] = useState<Product | null>(null);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Recipe[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Restock prompt & Voice assistant
  const [promptShoppingItem, setPromptShoppingItem] = useState<{
    name: string;
    category: ProductCategory;
    unit?: string;
    reason: string;
  } | null>(null);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize Data
  useEffect(() => {
    const loadedProds = loadProducts();
    setProducts(loadedProds);

    const loadedShop = loadShoppingItems();
    setShoppingItems(loadedShop);

    const loadedPrefs = loadPreferences();
    setPreferences(loadedPrefs);


    // Apply dark/light theme class to document element
    if (loadedPrefs.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check notifications
    const alerts = generateExpiryNotifications(loadedProds, loadedPrefs.reminderDays);
    setNotifications(alerts);

    // Request browser notification permission if enabled
    if (loadedPrefs.enableBrowserNotifications) {
      requestNotificationPermission();
    }
  }, []);

  // Sync theme changes
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);

    if (newPrefs.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Product CRUD
  const handleSaveProduct = (pPartial: Partial<Product>) => {
    let updated: Product[];

    if (productToEdit) {
      // Edit existing
      updated = products.map(p => p.id === productToEdit.id ? { ...p, ...pPartial } as Product : p);
      setProductToEdit(null);
    } else {
      // Create new
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        name: pPartial.name || 'Unnamed Item',
        category: (pPartial.category as ProductCategory) || 'Other',
        expiryDate: pPartial.expiryDate || new Date().toISOString().split('T')[0],
        mfdDate: pPartial.mfdDate,
        brand: pPartial.brand,
        location: (pPartial.location as ProductLocation) || 'Kitchen',
        barcode: pPartial.barcode,
        quantity: pPartial.quantity || 1,
        unit: pPartial.unit || 'pcs',
        price: pPartial.price,
        notes: pPartial.notes,
        image: pPartial.image,
        source: pPartial.source || 'Manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isUsed: false,
        ocrConfidence: pPartial.ocrConfidence,
        batchNumber: pPartial.batchNumber,
        mrp: pPartial.mrp,
      };
      updated = [newProduct, ...products];
    }

    setProducts(updated);
    saveProducts(updated);

    // Refresh notifications
    const freshAlerts = generateExpiryNotifications(updated, preferences.reminderDays);
    setNotifications(freshAlerts);

    // Navigate to dashboard or products list
    setActiveTab('products');
    setScanMethod('select');
  };

  // Shopping List Handlers
  const handleAddShoppingItem = (itemPartial: Omit<ShoppingItem, 'id' | 'createdAt' | 'isPurchased'>) => {
    const newItem: ShoppingItem = {
      id: `shop_${Date.now()}`,
      name: itemPartial.name,
      category: itemPartial.category,
      quantity: itemPartial.quantity || 1,
      unit: itemPartial.unit || 'pcs',
      priority: itemPartial.priority || 'Medium',
      notes: itemPartial.notes,
      expectedPrice: itemPartial.expectedPrice,
      store: itemPartial.store,
      isPurchased: false,
      createdAt: new Date().toISOString(),
      reason: itemPartial.reason || 'Manual entry',
    };
    const updated = [newItem, ...shoppingItems];
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleUpdateShoppingItem = (id: string, updates: Partial<ShoppingItem>) => {
    const updated = shoppingItems.map(item => item.id === id ? { ...item, ...updates } : item);
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleDeleteShoppingItem = (id: string) => {
    const updated = shoppingItems.filter(item => item.id !== id);
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleToggleShoppingPurchased = (id: string) => {
    const updated = shoppingItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isPurchased: !item.isPurchased,
          purchasedAt: !item.isPurchased ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleAddToPantryFromShopping = (item: ShoppingItem) => {
    const expDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    handleSaveProduct({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      price: item.expectedPrice,
      expiryDate: expDate,
      location: item.category === 'Dairy' || item.category === 'Fruits' || item.category === 'Vegetables' ? 'Refrigerator' : item.category === 'Medicine' ? 'Medicine Box' : 'Pantry',
      notes: `Restocked from Shopping List (${item.store || 'Store'})`,
      source: 'Manual',
    });
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveProducts(updated);

    if (target) {
      setPromptShoppingItem({
        name: target.name,
        category: target.category,
        unit: target.unit,
        reason: 'Finished / Deleted from Pantry',
      });
    }
  };

  const handleMarkUsed = (id: string) => {
    const target = products.find(p => p.id === id);
    const updated = products.map(p => p.id === id ? { ...p, isUsed: true, usedAt: new Date().toISOString() } : p);
    setProducts(updated);
    saveProducts(updated);

    if (target) {
      setPromptShoppingItem({
        name: target.name,
        category: target.category,
        unit: target.unit,
        reason: 'Item marked as finished',
      });
    }
  };

  const handleDeleteProductByName = (name: string): boolean => {
    const match = products.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      handleDeleteProduct(match.id);
      return true;
    }
    return false;
  };


  const handleToggleBookmarkRecipe = (recipe: Recipe) => {
    if (bookmarkedRecipes.some(r => r.id === recipe.id)) {
      setBookmarkedRecipes(bookmarkedRecipes.filter(r => r.id !== recipe.id));
    } else {
      setBookmarkedRecipes([...bookmarkedRecipes, recipe]);
    }
  };

  const handleResetData = () => {
    const demoData = getInitialDemoData();
    setProducts(demoData);
    saveProducts(demoData);
    const freshAlerts = generateExpiryNotifications(demoData, preferences.reminderDays);
    setNotifications(freshAlerts);
  };

  // Notification Mark Read
  const handleMarkNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Filtered and Sorted Products
  const filteredProducts = products.filter(p => {
    // Search query match
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q);

    // Category match
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

    // Location match
    const matchesLoc = selectedLocation === 'All' || p.location === selectedLocation;

    // Status match
    const status = getExpiryStatus(p.expiryDate);
    const matchesStatus = selectedStatus === 'All' || status === selectedStatus;

    return matchesSearch && matchesCat && matchesLoc && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'expiryAsc') return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    if (sortBy === 'expiryDesc') return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate stats counts
  const totalCount = products.length;
  const freshCount = products.filter(p => !p.isUsed && getExpiryStatus(p.expiryDate) === 'Fresh').length;
  const expiringSoonCount = products.filter(p => !p.isUsed && getExpiryStatus(p.expiryDate) === 'Expiring Soon').length;
  const expiredCount = products.filter(p => !p.isUsed && getExpiryStatus(p.expiryDate) === 'Expired').length;
  const usedProductsCount = products.filter(p => p.isUsed).length;
  const moneySaved = products.filter(p => p.isUsed).reduce((acc, p) => acc + (p.price || 3.5) * p.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-[#1A1C1E] dark:text-slate-100 flex transition-colors font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'scan') setScanMethod('select');
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        expiringSoonCount={expiringSoonCount}
        shoppingPendingCount={shoppingItems.filter(i => !i.isPurchased).length}
        onOpenVoiceAssistant={() => setShowVoiceAssistant(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        
        {/* Top Navbar */}
        <Navbar
          user={user}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onLogout={() => {
            setUser({
              uid: 'guest_123',
              email: 'guest@smartexpiry.ai',
              displayName: 'Guest User',
              isGuest: true,
            });
          }}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {/* VIEW 1: DASHBOARD & PRODUCTS */}
          {(activeTab === 'dashboard' || activeTab === 'products') && (
            <div>
              
              {/* Top Banner Stats */}
              <DashboardStats
                total={totalCount}
                fresh={freshCount}
                expiringSoon={expiringSoonCount}
                expired={expiredCount}
                selectedStatusFilter={selectedStatus}
                onSelectStatusFilter={(st) => setSelectedStatus(st)}
                currency={preferences.currency || '$'}
                moneySaved={moneySaved}
              />

              {/* Action Bar & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                
                {/* Section Title */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {activeTab === 'dashboard' ? 'Inventory Overview' : 'All Tracked Products'}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {filteredProducts.length} items
                    </span>
                  </h2>
                </div>

                {/* Quick Add / Scan Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('scan');
                      setScanMethod('select');
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-teal-200" />
                    <span>Quick Scan</span>
                  </button>

                  <button
                    onClick={() => {
                      setProductToEdit(null);
                      setActiveTab('manual');
                    }}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-[#E2E4E9] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1A1C1E] dark:text-slate-200 font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-teal-600" />
                    <span>Add Manually</span>
                  </button>
                </div>

              </div>

              {/* Category & Location Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-[#E2E4E9] dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">Category:</span>
                  {['All', 'Dairy', 'Vegetables', 'Fruits', 'Medicine', 'Bakery', 'Snacks', 'Other'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 font-medium">Location:</span>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                    >
                      {['All', 'Kitchen', 'Refrigerator', 'Medicine Box', 'Shelf', 'Pantry', 'Freezer'].map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 font-medium">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                    >
                      <option value="expiryAsc">Earliest Expiry</option>
                      <option value="expiryDesc">Latest Expiry</option>
                      <option value="name">Product Name</option>
                      <option value="added">Recently Added</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid of Product Cards */}
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-2xl">
                    📦
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    No products found
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                    Try adjusting your search query, status filters, or add a new product using the Camera OCR scanner.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('scan');
                      setScanMethod('select');
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md"
                  >
                    Scan First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={(p) => setSelectedProduct(p)}
                      onDeleteProduct={handleDeleteProduct}
                      onMarkUsed={handleMarkUsed}
                      onGenerateRecipeForProduct={(p) => {
                        setFocusProductForRecipe(p);
                        setActiveTab('recipes');
                      }}
                      onEditProduct={(p) => {
                        setProductToEdit(p);
                        setActiveTab('manual');
                      }}
                    />
                  ))}
                </div>
              )}

            </div>
          )}

          {/* VIEW 2: SMART SCANNER */}
          {activeTab === 'scan' && (
            <div>
              {scanMethod === 'select' && (
                <ScanModal
                  onSelectMethod={(method) => setScanMethod(method)}
                  onBackToDashboard={() => setActiveTab('dashboard')}
                />
              )}

              {scanMethod === 'camera' && (
                <CameraScannerModal
                  onBack={() => setScanMethod('select')}
                  onSaveProduct={handleSaveProduct}
                />
              )}

              {scanMethod === 'upload' && (
                <UploadScannerModal
                  onBack={() => setScanMethod('select')}
                  onSaveProduct={handleSaveProduct}
                />
              )}

              {scanMethod === 'barcode' && (
                <BarcodeScannerModal
                  onBack={() => setScanMethod('select')}
                  onSaveProduct={handleSaveProduct}
                />
              )}
            </div>
          )}

          {/* VIEW 3: MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <AddProductModal
              onBack={() => setActiveTab('dashboard')}
              onSaveProduct={handleSaveProduct}
              initialData={productToEdit || undefined}
            />
          )}

          {/* VIEW 4: SMART SHOPPING LIST */}
          {activeTab === 'shopping' && (
            <ShoppingListView
              items={shoppingItems}
              products={products}
              currency={preferences.currency || '$'}
              onAddItem={handleAddShoppingItem}
              onUpdateItem={handleUpdateShoppingItem}
              onDeleteItem={handleDeleteShoppingItem}
              onTogglePurchased={handleToggleShoppingPurchased}
              onAddToPantryFromShopping={handleAddToPantryFromShopping}
            />
          )}

          {/* VIEW 5: AI RECIPES */}
          {activeTab === 'recipes' && (
            <AiRecipeView
              products={products}
              bookmarkedRecipes={bookmarkedRecipes}
              onToggleBookmark={handleToggleBookmarkRecipe}
              dietaryPreference={preferences.dietaryPreference || 'None'}
              selectedFocusProduct={focusProductForRecipe}
            />
          )}

          {/* VIEW 6: AI CHAT */}
          {activeTab === 'chat' && (
            <AiChatView products={products} />
          )}

          {/* VIEW 7: ANALYTICS */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              products={products}
              currency={preferences.currency || '$'}
            />
          )}

          {/* VIEW 8: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsModal
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              user={user}
              products={products}
              onImportProducts={(imported) => {
                setProducts(imported);
                saveProducts(imported);
              }}
              onResetData={handleResetData}
            />
          )}

        </main>
      </div>

      {/* Floating AI Voice Assistant Button */}
      <button
        onClick={() => setShowVoiceAssistant(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-600/30 transition-transform active:scale-95 flex items-center gap-2.5 group"
        title="Open AI Voice Assistant"
      >
        <Mic className="w-6 h-6 text-teal-100 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline font-bold text-xs pr-1">AI Assistant</span>
      </button>

      {/* Auto-Restock Prompt Modal */}
      {promptShoppingItem && (
        <AddToShoppingPromptModal
          productName={promptShoppingItem.name}
          category={promptShoppingItem.category}
          unit={promptShoppingItem.unit}
          reason={promptShoppingItem.reason}
          onConfirm={(item) => {
            handleAddShoppingItem(item);
            setPromptShoppingItem(null);
          }}
          onCancel={() => setPromptShoppingItem(null)}
        />
      )}

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        products={products}
        onAddProduct={handleSaveProduct}
        onAddShoppingItem={handleAddShoppingItem}
        onDeleteProductByName={handleDeleteProductByName}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'scan') setScanMethod('select');
        }}
        onGenerateRecipeWithIngredients={(ings) => {
          setActiveTab('recipes');
        }}
      />

      {/* Product Details Drawer / Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onDelete={handleDeleteProduct}
          onMarkUsed={handleMarkUsed}
          onGenerateRecipe={(p) => {
            setFocusProductForRecipe(p);
            setActiveTab('recipes');
          }}
          onEdit={(p) => {
            setProductToEdit(p);
            setActiveTab('manual');
          }}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          user={user}
          onLogin={(loggedUser) => setUser(loggedUser)}
        />
      )}

    </div>
  );
}

export default App;
