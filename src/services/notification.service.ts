import { ApiService } from "./api.service";
import type { INotificationList } from "@/interfaces/forecast.interface";

const apiService = new ApiService();

/** Quantas notificações o sino mostra (T-DF12). */
export const NOTIFICATIONS_LIMIT = 20;

/** Sino de notificações (T-DF12): só as do usuário do token. */
export const notificationService = {
  /** GET /api/notifications?limit=20: contador de não lidas e as últimas, lidas ou não. */
  getLatest(token?: string): Promise<INotificationList> {
    return apiService.get<INotificationList>(
      "notifications",
      { limit: NOTIFICATIONS_LIMIT },
      token
    );
  },

  /** PATCH /api/notifications/{id}/read */
  markRead(id: string, token?: string): Promise<void> {
    return apiService.patch<void>(`notifications/${id}/read`, {}, token);
  },

  /** PATCH /api/notifications/read-all */
  markAllRead(token?: string): Promise<void> {
    return apiService.patch<void>("notifications/read-all", {}, token);
  },
};
