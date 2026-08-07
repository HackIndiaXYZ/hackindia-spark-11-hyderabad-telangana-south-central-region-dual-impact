import { Product, ProductStatus } from '../types';

/**
 * Safely parses date strings supporting YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, and DD-MM-YY
 * Defaulting to Indian date format (DD/MM/YYYY) without swapping day and month.
 */
export function parseAnyDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // 1. YYYY-MM-DD or YYYY/MM/DD
  const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10);
    const day = parseInt(ymd[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return new Date(year, month - 1, day);
    }
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY or DD-MM-YY (Indian date format: Day first, Month second)
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return new Date(year, month - 1, day);
    }
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Calculates days remaining until expiry.
 * Returns negative numbers for expired items.
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = parseAnyDate(expiryDateStr) || new Date(expiryDateStr);
  if (isNaN(expiryDate.getTime())) return 0;
  expiryDate.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines product status:
 * - Expired: days < 0
 * - Expiring Soon: 0 <= days <= 7
 * - Fresh: days > 7
 */
export function getExpiryStatus(expiryDateStr: string): ProductStatus {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days < 0) return 'Expired';
  if (days <= 7) return 'Expiring Soon';
  return 'Fresh';
}

/**
 * Formats date string into human readable string (e.g. "30 Nov 2026", "09-11-2026", or "Tomorrow")
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const days = getDaysUntilExpiry(dateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';

  const date = parseAnyDate(dateStr) || new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Human-readable relative badge label (e.g. "Expires in 3 days", "Expired 5 days ago")
 */
export function getExpiryLabel(expiryDateStr: string): string {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days === 0) return 'Expires Today';
  if (days === 1) return 'Expires Tomorrow';
  if (days > 1) return `Expires in ${days} days`;
  if (days === -1) return 'Expired Yesterday';
  return `Expired ${Math.abs(days)} days ago`;
}

export function calculateInventoryStats(products: Product[]) {
  const activeProducts = products.filter(p => !p.isUsed);
  const total = activeProducts.length;

  let fresh = 0;
  let expiringSoon = 0;
  let expired = 0;
  let totalValue = 0;

  activeProducts.forEach(product => {
    const status = getExpiryStatus(product.expiryDate);
    if (status === 'Fresh') fresh++;
    else if (status === 'Expiring Soon') expiringSoon++;
    else if (status === 'Expired') expired++;

    if (product.price) {
      totalValue += product.price * (product.quantity || 1);
    }
  });

  const usedProducts = products.filter(p => p.isUsed);
  const moneySaved = usedProducts.reduce((acc, p) => acc + (p.price || 5) * (p.quantity || 1), 0);

  return {
    total,
    fresh,
    expiringSoon,
    expired,
    totalValue,
    moneySaved,
    usedCount: usedProducts.length
  };
}
