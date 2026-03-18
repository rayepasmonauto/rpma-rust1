'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/shared/hooks/useAuth';
import { getNotifications } from '../services/notificationActions';

export function useNotificationUpdates() {
  const { user } = useAuth();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const [knownNotificationIds, setKnownNotificationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (knownNotificationIds.size > 0) {
      console.debug(`Tracking ${knownNotificationIds.size} notifications`);
    }
    mountedRef.current = true;

    // Fetch initial notifications
    if (user?.token) {
      getNotifications().then((result) => {
        if (!mountedRef.current) return;
        if (result.success && result.data) {
          setKnownNotificationIds(new Set(result.data.notifications.map((n: any) => n.id)));
        }
      });
    }

    function startPolling() {
      if (!mountedRef.current || !user?.token) return;

      // S-2 perf: interval raised 30s→120s; skip when tab is hidden (visibilityState guard).
      pollTimerRef.current = setInterval(async () => {
        if (!mountedRef.current) return;
        if (document.visibilityState !== 'visible') return;

        const result = await getNotifications();
        if (result.success && result.data) {
          setKnownNotificationIds((prevIds) => {
            const newIds = new Set(prevIds);
            const newNotifications = result.data!.notifications.filter((n: any) => !prevIds.has(n.id));

            // Show toast for new unread notifications
            newNotifications.forEach((notification: any) => {
              if (!notification.read) {
                toast(notification.title, {
                  description: notification.message,
                  action: {
                    label: 'View',
                    onClick: () => {
                      window.location.href = notification.entity_url;
                    },
                  },
                });
              }
              newIds.add(notification.id);
            });

            return newIds;
          });
        }
      }, 120000); // S-2: raised from 30s to 120s (offline-first, tab guard above)
    }

    startPolling();

    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [user?.token]);
}

