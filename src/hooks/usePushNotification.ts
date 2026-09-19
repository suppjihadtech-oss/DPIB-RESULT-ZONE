import { useState, useEffect, useCallback } from 'react';
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermissionAndToken,
  unsubscribeNotifications,
  subscribeToForegroundNotifications,
  showLocalNotification,
} from '../services/notification';
import { PushNotificationPayload } from '../types';

export function usePushNotification() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [incomingNotification, setIncomingNotification] = useState<PushNotificationPayload | null>(null);

  // Initialize status on mount
  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      const supported = await isPushNotificationSupported();
      if (!mounted) return;
      setIsSupported(supported);

      if (!supported) {
        setPermission('unsupported');
        return;
      }

      const perm = getNotificationPermissionStatus();
      setPermission(perm);

      const savedToken = localStorage.getItem('dpib_fcm_token');
      const isEnabled = localStorage.getItem('dpib_notifications_enabled') === 'true';

      if (perm === 'granted' && savedToken && isEnabled) {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    }

    checkStatus();

    // Listen to foreground messages
    let unsubscribeForeground: (() => void) | null = null;
    subscribeToForegroundNotifications((payload) => {
      if (mounted) {
        setIncomingNotification(payload);
      }
    }).then((unsub) => {
      if (mounted && unsub) {
        unsubscribeForeground = unsub;
      }
    });

    return () => {
      mounted = false;
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []);

  // Manually refresh/check permission from browser
  const checkPermission = useCallback(() => {
    const perm = getNotificationPermissionStatus();
    setPermission(perm);
    const savedToken = localStorage.getItem('dpib_fcm_token');
    const isEnabled = localStorage.getItem('dpib_notifications_enabled') === 'true';
    if (perm === 'granted' && savedToken && isEnabled) {
      setIsSubscribed(true);
    } else if (perm === 'denied') {
      setIsSubscribed(false);
    }
    return perm;
  }, []);

  // Request & Enable Push Notifications
  const enableNotifications = useCallback(
    async (preferences?: { preferredDepartment?: string; preferredSemester?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const res = await requestNotificationPermissionAndToken(preferences);
        const currentPerm = getNotificationPermissionStatus();
        setPermission(currentPerm);

        if (res.success && res.token) {
          setIsSubscribed(true);
          setLoading(false);
          return { success: true };
        } else {
          setError(res.error || 'নোটিফিকেশন সক্রিয় করা যায়নি।');
          setLoading(false);
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        const msg = err?.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।';
        setError(msg);
        setPermission(getNotificationPermissionStatus());
        setLoading(false);
        return { success: false, error: msg };
      }
    },
    []
  );

  // Disable / Mute Notifications
  const disableNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await unsubscribeNotifications();
      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  }, []);

  // Send a test notification
  const triggerTestNotification = useCallback(() => {
    showLocalNotification({
      title: 'DPIB RESULT ZONE নোটিফিকেশন সফল!',
      body: 'অভিনন্দন! আপনার ডিভাইসে পুশ নোটিফিকেশন সফলভাবে সক্রিয় হয়েছে।',
      type: 'GENERAL',
      url: '/?tab=notices',
    });
  }, []);

  const clearIncomingNotification = useCallback(() => {
    setIncomingNotification(null);
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    incomingNotification,
    enableNotifications,
    disableNotifications,
    triggerTestNotification,
    clearIncomingNotification,
    checkPermission,
  };
}
