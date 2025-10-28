'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function PWANotifications() {
  useEffect(() => {
    // Check if service worker and push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    // Request notification permission if not already granted
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted');
          
          // Register for push notifications
          const registration = await navigator.serviceWorker.ready;
          
          // Subscribe to push notifications (you'll need to implement the server-side)
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
            ) as BufferSource,
          });
          
          // Send subscription to server
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
          });
          
          toast.success('Notificaciones activadas', {
            description: 'Recibirás recordatorios de citas',
          });
        } else if (permission === 'denied') {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    // Don't request immediately, wait for user interaction
    const timer = setTimeout(() => {
      if (Notification.permission === 'default') {
        // Could show a custom UI here before requesting
        // requestPermission();
      }
    }, 10000); // Wait 10 seconds

    return () => clearTimeout(timer);
  }, []);

  return null;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
