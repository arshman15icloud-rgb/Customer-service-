import { useState, useEffect } from 'react';
import { api } from './api';

const CUSTOMER_ID_KEY = 'vertex_care_customer_id';
const CUSTOMER_NAME_KEY = 'vertex_care_customer_name';
const CUSTOMER_EMAIL_KEY = 'vertex_care_customer_email';

export function getOrCreateCustomerId(): string {
  let id = localStorage.getItem(CUSTOMER_ID_KEY);
  if (!id) {
    id = 'cust-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    localStorage.setItem(CUSTOMER_ID_KEY, id);
  }
  return id;
}

export function getStoredCustomerProfile(): { id: string; name: string; email: string } {
  const id = getOrCreateCustomerId();
  const name = localStorage.getItem(CUSTOMER_NAME_KEY) || 'Guest Customer';
  const email = localStorage.getItem(CUSTOMER_EMAIL_KEY) || '';
  return { id, name, email };
}

export function saveCustomerProfile(name: string, email?: string) {
  if (name) localStorage.setItem(CUSTOMER_NAME_KEY, name);
  if (email) localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      return true;
    }
    return false;
  };

  return { isInstallable, isInstalled, triggerInstall };
}

export async function requestWebPushPermission(customerId: string): Promise<{ granted: boolean; message: string }> {
  if (!('Notification' in window)) {
    return { granted: false, message: "Notifications aren't supported on this device/browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Simulate registering subscription or service worker push
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          // In real production with VAPID key: reg.pushManager.subscribe({...})
        }
      } catch (swErr) {
        // Fallback
      }

      await api.registerPushSubscription(customerId, { granted: true, timestamp: new Date().toISOString() });
      return { granted: true, message: 'Push notifications successfully enabled! You will receive updates about drops and responses.' };
    } else {
      return { granted: false, message: 'Notification permission was denied. You can enable it anytime in browser settings.' };
    }
  } catch (err: any) {
    return { granted: false, message: `Could not enable notifications: ${err.message}` };
  }
}
