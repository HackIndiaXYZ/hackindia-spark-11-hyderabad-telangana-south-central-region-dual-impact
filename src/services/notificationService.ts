import { Product, UserPreferences } from '../types';
import { getDaysUntilExpiry } from '../utils/dateUtils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  productId?: string;
  type: 'urgent' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}

export class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications.');
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
  }

  public sendNotification(title: string, body: string, icon = '/icon.png'): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
      } catch (err) {
        console.error('Error triggering browser notification:', err);
      }
    }
  }

  public checkInventoryAlerts(products: Product[], prefs: UserPreferences): AppNotification[] {
    const notifications: AppNotification[] = [];
    const activeProducts = products.filter(p => !p.isUsed);

    activeProducts.forEach(product => {
      const days = getDaysUntilExpiry(product.expiryDate);

      // Check against user's reminder schedule preferences (e.g. [7, 3, 2, 1, 0])
      if (prefs.reminderDays.includes(days)) {
        let title = '';
        let message = '';
        let type: 'urgent' | 'warning' | 'info' = 'info';

        if (days < 0) {
          title = `🚨 Product Expired: ${product.name}`;
          message = `Your ${product.name} expired ${Math.abs(days)} day(s) ago. Please check before consumption.`;
          type = 'urgent';
        } else if (days === 0) {
          title = `⚠️ Expiring Today: ${product.name}`;
          message = `Your ${product.name} expires today! Use it now or generate a recipe.`;
          type = 'urgent';
        } else if (days === 1) {
          title = `🥛 Expiring Tomorrow: ${product.name}`;
          message = `Your ${product.name} expires tomorrow. Plan your meal today!`;
          type = 'warning';
        } else {
          title = `🔔 Reminder: ${product.name}`;
          message = `Your ${product.name} will expire in ${days} days (${product.expiryDate}).`;
          type = 'info';
        }

        notifications.push({
          id: `notif-${product.id}-${days}`,
          title,
          message,
          productId: product.id,
          type,
          timestamp: new Date().toISOString(),
          read: false,
        });

        if (prefs.enableBrowserNotifications && (days === 0 || days === 1)) {
          this.sendNotification(title, message);
        }
      }
    });

    return notifications;
  }
}

export const notificationService = NotificationService.getInstance();

export function generateExpiryNotifications(products: Product[], reminderDays: number[] = [7, 3, 2, 1, 0]): AppNotification[] {
  return notificationService.checkInventoryAlerts(products, {
    theme: 'light',
    enableBrowserNotifications: true,
    reminderDays,
    currency: '$',
    dietaryPreference: 'None',
  });
}

export function requestNotificationPermission(): Promise<boolean> {
  return notificationService.requestPermission();
}
