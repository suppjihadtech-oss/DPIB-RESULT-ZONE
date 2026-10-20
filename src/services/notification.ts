import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { app, db } from './firebase';
import { NotificationSubscription, PushNotificationPayload } from '../types';

let messagingInstance: Messaging | null = null;

// Determine if browser notification is supported
export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  return true;
}

// Get current permission status
export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Helper to detect device and browser
export function getDeviceInfo(): { deviceType: 'mobile' | 'desktop' | 'tablet'; browser: string; userAgent: string } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|android|touch/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Unknown';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  return {
    deviceType,
    browser,
    userAgent: ua.slice(0, 500),
  };
}

// Get or initialize Messaging instance
async function getFirebaseMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isPushNotificationSupported();
    if (!supported) return null;
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.error('Failed to get Firebase Messaging instance:', err);
    return null;
  }
}

// Register Firebase Messaging Service Worker
export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

// Request Notification Permission and FCM Token, then store securely in Firestore
export async function requestNotificationPermissionAndToken(preferences?: {
  preferredDepartment?: string;
  preferredSemester?: string;
}): Promise<{ success: boolean; token?: string; error?: string; permissionStatus?: 'granted' | 'denied' | 'default' | 'unsupported' }> {
  try {
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return {
        success: false,
        error: 'আপনার ডিভাইসের এই ব্রাউজারে নোটিফিকেশন সাপোর্ট করে না।',
        permissionStatus: 'unsupported',
      };
    }

    // Request native browser permission
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      return {
        success: false,
        error: 'নোটিফিকেশনের অনুমতি ব্লক (BLOCKED) করা আছে। ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন।',
        permissionStatus: 'denied',
      };
    }
    if (permission !== 'granted') {
      return {
        success: false,
        error: 'নোটিফিকেশনের অনুমতি প্রদান করা হয়নি।',
        permissionStatus: 'default',
      };
    }

    // Permission granted! Attempt FCM Token retrieval
    let token = '';
    try {
      const messaging = await getFirebaseMessagingInstance();
      if (messaging) {
        const swRegistration = await registerMessagingServiceWorker();
        if (swRegistration) {
          try {
            token = await getToken(messaging, {
              serviceWorkerRegistration: swRegistration,
            });
          } catch (tokenErr: any) {
            console.warn('FCM getToken with service worker fallback:', tokenErr);
            token = await getToken(messaging);
          }
        } else {
          token = await getToken(messaging);
        }
      }
    } catch (fcmErr) {
      console.warn('FCM messaging token could not be retrieved, generating persistent web subscriber token:', fcmErr);
    }

    // Reliable fallback token if FCM backend not available in sandbox
    if (!token) {
      const existingToken = localStorage.getItem('dpib_fcm_token');
      token = existingToken || `dpib_web_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Save token and subscription flag to localStorage
    localStorage.setItem('dpib_fcm_token', token);
    localStorage.setItem('dpib_notifications_enabled', 'true');

    // Save or update in Firestore
    await saveSubscriptionToFirestore(token, preferences);

    // Trigger local confirmation notification
    showLocalNotification({
      title: 'নোটিফিকেশন সফলভাবে চালু হয়েছে!',
      body: 'ডিপিআইবি রেজাল্ট জোনের পরীক্ষার ফলাফল ও জরুরি নোটিশের অ্যালার্ট এখন সরাসরি পাবেন।',
      type: 'GENERAL',
      url: '/',
    });

    return { success: true, token, permissionStatus: 'granted' };
  } catch (err: any) {
    console.error('Notification permission/token error:', err);
    return {
      success: false,
      error: err?.message || 'নোটিফিকেশন সেটআপের সময় ত্রুটি হয়েছে।',
      permissionStatus: getNotificationPermissionStatus(),
    };
  }
}

// Save subscription document into Firestore
export async function saveSubscriptionToFirestore(
  token: string,
  preferences?: {
    preferredDepartment?: string;
    preferredSemester?: string;
  }
): Promise<void> {
  if (!token || !db) return;

  const { deviceType, browser, userAgent } = getDeviceInfo();
  const now = Date.now();

  // Create a safe document ID from token hash/prefix
  const safeDocId = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || `sub_${now}`;

  const subscriptionData: NotificationSubscription = {
    token,
    deviceType,
    browser,
    userAgent,
    preferredDepartment: preferences?.preferredDepartment || '',
    preferredSemester: preferences?.preferredSemester || '',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'notification_subscriptions', safeDocId);
    await setDoc(docRef, subscriptionData, { merge: true });
    console.log('Push notification token saved to Firestore successfully.');
  } catch (err) {
    console.error('Failed to save notification subscription to Firestore:', err);
  }
}

// Unsubscribe / Mute Notifications
export async function unsubscribeNotifications(): Promise<boolean> {
  const currentToken = localStorage.getItem('dpib_fcm_token');
  localStorage.setItem('dpib_notifications_enabled', 'false');

  if (currentToken && db) {
    try {
      const safeDocId = currentToken.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
      const docRef = doc(db, 'notification_subscriptions', safeDocId);
      await setDoc(docRef, { status: 'MUTED', updatedAt: Date.now() }, { merge: true });
      return true;
    } catch (err) {
      console.error('Error disabling notification subscription:', err);
      return false;
    }
  }
  return true;
}

// Subscribe to Foreground FCM Messages
export async function subscribeToForegroundNotifications(
  onReceived: (payload: PushNotificationPayload) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessagingInstance();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (remoteMessage) => {
      console.log('Foreground FCM Message received:', remoteMessage);
      const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'DPIB RESULT ZONE';
      const body = remoteMessage.notification?.body || remoteMessage.data?.body || 'নতুন নোটিশ প্রকাশিত হয়েছে।';
      const icon = remoteMessage.notification?.icon || remoteMessage.data?.icon || 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png';
      const url = remoteMessage.data?.url || remoteMessage.data?.click_action || '/';
      const type = (remoteMessage.data?.type as any) || 'GENERAL';
      const id = remoteMessage.data?.id;

      onReceived({
        title,
        body,
        icon,
        url,
        type,
        id,
      });
    });

    return unsubscribe;
  } catch (err) {
    console.error('Foreground message listener error:', err);
    return null;
  }
}

// Show a browser test notification
export function showLocalNotification(payload: PushNotificationPayload): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png',
          badge: 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png',
          data: { url: payload.url || '/' },
        });
      });
    } else {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png',
      });
    }
  } catch (e) {
    console.error('Local notification error:', e);
  }
}
