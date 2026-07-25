import { Product, ProductStatus } from '../types';

/**
 * Calculates days remaining until expiry.
 * Returns negative numbers for expired items.
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = new Date(expiryDateStr);
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
 * Formats YYYY-MM-DD string into human readable string (e.g. "Nov 30, 2026" or "Tomorrow")
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const days = getDaysUntilExpiry(dateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
