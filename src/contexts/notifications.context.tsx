import { createContext } from "react";
import type { INotification } from "@/interfaces/forecast.interface";

export type NotificationsContextType = {
  /** Últimas 20, das mais novas para as mais antigas. */
  items: INotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const NotificationsContext =
  createContext<NotificationsContextType | null>(null);
