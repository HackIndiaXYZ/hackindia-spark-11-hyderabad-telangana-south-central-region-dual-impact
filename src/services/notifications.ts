import { Product, UserSettings } from '../types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const sendLocalNotification = (title: string, body: string, iconUrl?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    // Console fallback
    console.log(`[MOCK NOTIFICATION] Title: ${title} | Body: ${body}`);
    return;
  }

  try {
    const options: NotificationOptions = {
      body,
      icon: iconUrl || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
    };
    new Notification(title, options);
  } catch (e) {
    console.error('Error sending local notification:', e);
  }
};

/**
 * Scans inventory and alerts user of items that match settings notification timings.
 * Runs in the background when the app loads or items are updated.
 */
export const checkAndTriggerExpiryNotifications = (
  products: Product[],
  settings: UserSettings
) => {
  if (!settings.notificationsEnabled) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  products.forEach((product) => {
    const expiry = new Date(product.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if the difference matches the user settings reminder schedules
    if (settings.reminderDays.includes(diffDays)) {
      let title = '';
      let body = '';
      
      const categoryEmoji: { [key: string]: string } = {
        Medicine: '💊',
        Dairy: '🥛',
        Vegetables: '🥬',
        Fruits: '🍓',
        Bakery: '🍞',
        Snacks: '🍪',
        Beverages: '🥤',
        Other: '🏷️'
      };
      
      const emoji = categoryEmoji[product.category] || '📦';

      if (diffDays === 0) {
        title = `⚠️ Expiry Alert: ${product.name}`;
        body = `${emoji} Your ${product.name} expires TODAY. Use it immediately to avoid waste!`;
      } else if (diffDays === 1) {
        title = `🥛 Expiry Warning: ${product.name}`;
        body = `${emoji} Your ${product.name} expires tomorrow. Use it before it gets wasted.`;
      } else {
        title = `⏰ Expiry Soon: ${product.name}`;
        body = `${emoji} Your ${product.name} expires in ${diffDays} days (on ${product.expiryDate}).`;
      }

      // Check if we already notified about this today to avoid spam
      const notificationKey = `notified_${product.id}_${diffDays}_${today.toISOString().split('T')[0]}`;
      const alreadyNotified = localStorage.getItem(notificationKey);

      if (!alreadyNotified) {
        sendLocalNotification(title, body, product.imageUrl);
        localStorage.setItem(notificationKey, 'true');
      }
    }
  });
};
