import { 
  db, 
  isConfigured,
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs
} from './firebase';
import { Product, ShoppingItem } from '../types';

// Sync products from Firestore (realtime)
export function syncProducts(userId: string, callback: (products: Product[]) => void): () => void {
  if (!isConfigured || !db || !userId) {
    return () => {};
  }

  const q = query(collection(db, 'products'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    callback(products);
  }, (err) => {
    console.error('Error syncing products from Firestore:', err);
  });
}

// Sync shopping items from Firestore (realtime)
export function syncShoppingItems(userId: string, callback: (items: ShoppingItem[]) => void): () => void {
  if (!isConfigured || !db || !userId) {
    return () => {};
  }

  const q = query(collection(db, 'shoppingItems'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const items: ShoppingItem[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ShoppingItem);
    });
    callback(items);
  }, (err) => {
    console.error('Error syncing shopping items from Firestore:', err);
  });
}

// Add/Update/Delete Products in Firestore
export async function dbAddProduct(userId: string, product: Product): Promise<void> {
  if (isConfigured && db) {
    const { id, ...data } = product;
    await setDoc(doc(db, 'products', id), { ...data, userId });
  }
}

export async function dbUpdateProduct(userId: string, productId: string, updates: Partial<Product>): Promise<void> {
  if (isConfigured && db) {
    await updateDoc(doc(db, 'products', productId), updates);
  }
}

export async function dbDeleteProduct(userId: string, productId: string): Promise<void> {
  if (isConfigured && db) {
    await deleteDoc(doc(db, 'products', productId));
  }
}

// Add/Update/Delete Shopping Items in Firestore
export async function dbAddShoppingItem(userId: string, item: ShoppingItem): Promise<void> {
  if (isConfigured && db) {
    const { id, ...data } = item;
    await setDoc(doc(db, 'shoppingItems', id), { ...data, userId });
  }
}

export async function dbUpdateShoppingItem(userId: string, itemId: string, updates: Partial<ShoppingItem>): Promise<void> {
  if (isConfigured && db) {
    await updateDoc(doc(db, 'shoppingItems', itemId), updates);
  }
}

export async function dbDeleteShoppingItem(userId: string, itemId: string): Promise<void> {
  if (isConfigured && db) {
    await deleteDoc(doc(db, 'shoppingItems', itemId));
  }
}

// Merge local data to Firestore when user logs in
export async function mergeLocalDataToFirestore(
  userId: string, 
  localProducts: Product[], 
  localShoppingItems: ShoppingItem[]
): Promise<void> {
  if (!isConfigured || !db || !userId) return;
  
  try {
    // Merge products
    const pQuery = query(collection(db, 'products'), where('userId', '==', userId));
    const pSnapshot = await getDocs(pQuery);
    const existingProductIds = new Set<string>();
    pSnapshot.forEach((doc) => existingProductIds.add(doc.id));
    
    for (const p of localProducts) {
      if (!existingProductIds.has(p.id)) {
        await dbAddProduct(userId, p);
      }
    }

    // Merge shopping items
    const sQuery = query(collection(db, 'shoppingItems'), where('userId', '==', userId));
    const sSnapshot = await getDocs(sQuery);
    const existingShoppingIds = new Set<string>();
    sSnapshot.forEach((doc) => existingShoppingIds.add(doc.id));

    for (const item of localShoppingItems) {
      if (!existingShoppingIds.has(item.id)) {
        await dbAddShoppingItem(userId, item);
      }
    }
  } catch (err) {
    console.error('Error merging local data to Firestore:', err);
  }
}
