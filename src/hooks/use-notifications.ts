"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  type AppNotification,
} from "@/lib/notifications";
import { useUser } from "@/components/UserContext";

/** Fetch and manage notifications for the current user */
export function useNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    const [notifs, count] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for local notification events (same-tab updates)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("reverbic-notification", handler);
    return () => window.removeEventListener("reverbic-notification", handler);
  }, [refresh]);

  // Poll every 30s for cross-tab / server-side notifications
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [user?.id, refresh]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    await markAsRead(id);
    await refresh();
  }, [refresh]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    await markAllAsRead(user.id);
    await refresh();
  }, [user?.id, refresh]);

  const handleClearAll = useCallback(async () => {
    if (!user?.id) return;
    await clearAllNotifications(user.id);
    await refresh();
  }, [user?.id, refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  };
}
