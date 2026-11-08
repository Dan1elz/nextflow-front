import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { NotificationsContext } from "@/contexts/notifications.context";
import type { INotificationList } from "@/interfaces/forecast.interface";
import { notificationService } from "@/services/notification.service";

/** De quanto em quanto tempo o sino confere se chegou notificação nova. */
export const NOTIFICATIONS_REFRESH_MS = 60_000;

const LOAD_ERROR = "Não foi possível carregar as notificações.";
const MARK_ERROR = "Não foi possível marcar como lida.";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const EMPTY: INotificationList = { unreadCount: 0, items: [] };

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const authToken = token ?? undefined;

  const [data, setData] = useState<INotificationList>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await notificationService.getLatest(authToken));
      setError(null);
    } catch (err) {
      setError(errorMessage(err, LOAD_ERROR));
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => {
      void reload();
    }, NOTIFICATIONS_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const markRead = useCallback(
    async (id: string) => {
      try {
        await notificationService.markRead(id, authToken);
      } catch (err) {
        toast.error(errorMessage(err, MARK_ERROR));
        return;
      }
      const readAt = new Date().toISOString();
      setData((prev) => {
        const target = prev.items.find((item) => item.id === id);
        if (!target || target.readAt) return prev;
        return {
          unreadCount: Math.max(0, prev.unreadCount - 1),
          items: prev.items.map((item) =>
            item.id === id ? { ...item, readAt } : item
          ),
        };
      });
    },
    [authToken]
  );

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead(authToken);
    } catch (err) {
      toast.error(errorMessage(err, MARK_ERROR));
      return;
    }
    const readAt = new Date().toISOString();
    setData((prev) => ({
      unreadCount: 0,
      items: prev.items.map((item) =>
        item.readAt ? item : { ...item, readAt }
      ),
    }));
  }, [authToken]);

  const value = useMemo(
    () => ({
      items: data.items,
      unreadCount: data.unreadCount,
      loading,
      error,
      reload,
      markRead,
      markAllRead,
    }),
    [data, loading, error, reload, markRead, markAllRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
