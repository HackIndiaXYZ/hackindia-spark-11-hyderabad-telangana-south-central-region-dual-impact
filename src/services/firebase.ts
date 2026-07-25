import { Product, ShoppingItem, User } from '../types';

// Let's store mock Firestore collections in localStorage
const FIRESTORE_PRODUCTS_KEY = 'mock_firestore_products';
const FIRESTORE_SHOPPING_KEY = 'mock_firestore_shopping_items';

const getFirestoreProducts = (): any[] => {
  const data = localStorage.getItem(FIRESTORE_PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveFirestoreProducts = (products: any[]) => {
  localStorage.setItem(FIRESTORE_PRODUCTS_KEY, JSON.stringify(products));
  notifyListeners('products');
};

const getFirestoreShopping = (): any[] => {
  const data = localStorage.getItem(FIRESTORE_SHOPPING_KEY);
  return data ? JSON.parse(data) : [];
};

const saveFirestoreShopping = (items: any[]) => {
  localStorage.setItem(FIRESTORE_SHOPPING_KEY, JSON.stringify(items));
  notifyListeners('shoppingItems');
};

// Event listeners for onSnapshot simulation
const listeners: Record<string, Set<() => void>> = {
  products: new Set(),
  shoppingItems: new Set(),
};

function subscribeToCollection(collectionName: string, callback: () => void) {
  listeners[collectionName]?.add(callback);
  return () => {
    listeners[collectionName]?.delete(callback);
  };
}

function notifyListeners(collectionName: string) {
  listeners[collectionName]?.forEach(cb => cb());
}

// Exported Firebase instances
export const isConfigured = true; 
export const app = {};
export const auth = {
  currentUser: null as any,
};
export const db = {};

export function getFirestore() { return db; }
export function getAuth() { return auth; }

// --- AUTHENTICATION MOCKS ---
export class GoogleAuthProvider {}

export async function signInWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const user = {
    uid: `firebase_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
    email,
    displayName: email.split('@')[0],
    isGuest: false,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  };
  auth.currentUser = user;
  return { user };
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const user = {
    uid: `firebase_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
    email,
    displayName: email.split('@')[0],
    isGuest: false,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  };
  auth.currentUser = user;
  return { user };
}

export async function signInWithPopup(authInstance: any, provider: any) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const user = {
    uid: 'firebase_user_google123',
    email: 'alex.morgan@gmail.com',
    displayName: 'Alex Morgan',
    isGuest: false,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  };
  auth.currentUser = user;
  return { user };
}

// --- FIRESTORE MOCKS ---
export function collection(dbInstance: any, path: string) {
  return { path };
}

export function doc(dbInstance: any, path: string, childPath: string) {
  return { path, id: childPath };
}

export function query(collectionInstance: any, ...queryConstraints: any[]) {
  return { collection: collectionInstance, constraints: queryConstraints };
}

export function where(field: string, op: string, value: any) {
  return { field, op, value };
}

export async function setDoc(docRef: any, data: any) {
  const colPath = docRef.path; 
  if (colPath === 'products') {
    const products = getFirestoreProducts();
    const index = products.findIndex(p => p.id === docRef.id);
    const newProd = { id: docRef.id, ...data };
    if (index >= 0) {
      products[index] = newProd;
    } else {
      products.push(newProd);
    }
    saveFirestoreProducts(products);
  } else if (colPath === 'shoppingItems') {
    const items = getFirestoreShopping();
    const index = items.findIndex(i => i.id === docRef.id);
    const newItem = { id: docRef.id, ...data };
    if (index >= 0) {
      items[index] = newItem;
    } else {
      items.push(newItem);
    }
    saveFirestoreShopping(items);
  }
}

export async function updateDoc(docRef: any, data: any) {
  const colPath = docRef.path;
  if (colPath === 'products') {
    const products = getFirestoreProducts();
    const index = products.findIndex(p => p.id === docRef.id);
    if (index >= 0) {
      products[index] = { ...products[index], ...data };
      saveFirestoreProducts(products);
    }
  } else if (colPath === 'shoppingItems') {
    const items = getFirestoreShopping();
    const index = items.findIndex(i => i.id === docRef.id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data };
      saveFirestoreShopping(items);
    }
  }
}

export async function deleteDoc(docRef: any) {
  const colPath = docRef.path;
  if (colPath === 'products') {
    const products = getFirestoreProducts();
    const filtered = products.filter(p => p.id !== docRef.id);
    saveFirestoreProducts(filtered);
  } else if (colPath === 'shoppingItems') {
    const items = getFirestoreShopping();
    const filtered = items.filter(i => i.id !== docRef.id);
    saveFirestoreShopping(filtered);
  }
}

export async function getDocs(queryInstance: any) {
  const colPath = queryInstance.collection.path;
  let items = colPath === 'products' ? getFirestoreProducts() : getFirestoreShopping();
  
  // Apply userId filter if present
  const userIdConstraint = queryInstance.constraints.find((c: any) => c.field === 'userId');
  if (userIdConstraint) {
    items = items.filter(item => item.userId === userIdConstraint.value);
  }
  
  return {
    forEach: (cb: (doc: any) => void) => {
      items.forEach(item => {
        cb({
          id: item.id,
          data: () => {
            const { id, ...rest } = item;
            return rest;
          }
        });
      });
    }
  };
}

export function onSnapshot(queryInstance: any, callback: (snapshot: any) => void, errorCallback?: (err: any) => void) {
  const colPath = queryInstance.collection.path;
  
  const triggerCallback = () => {
    let items = colPath === 'products' ? getFirestoreProducts() : getFirestoreShopping();
    const userIdConstraint = queryInstance.constraints.find((c: any) => c.field === 'userId');
    if (userIdConstraint) {
      items = items.filter(item => item.userId === userIdConstraint.value);
    }
    
    const docArray: any[] = [];
    items.forEach(item => {
      docArray.push({
        id: item.id,
        data: () => {
          const { id, ...rest } = item;
          return rest;
        }
      });
    });
    
    callback({
      forEach: (cb: (doc: any) => void) => {
        docArray.forEach(d => cb(d));
      }
    });
  };

  // Trigger initial callback
  triggerCallback();

  // Subscribe to updates
  return subscribeToCollection(colPath, triggerCallback);
}
