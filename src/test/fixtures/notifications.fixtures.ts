import type { INotificationList } from "@/interfaces/forecast.interface";

/** Sino (T-DF12): 2 não lidas e 1 lida, das mais novas para as mais antigas. */
export const notificationList: INotificationList = {
  unreadCount: 2,
  items: [
    {
      id: "6f1c3c1e-0b1a-4c3e-9a51-000000000001",
      type: "NewRecommendations",
      title: "Nova análise com 8 recomendações",
      message: "6 de compra e 2 de promoção na análise de 08/11.",
      link: "/forecast",
      createdAt: "2026-11-08T06:00:00Z",
      readAt: null,
    },
    {
      id: "6f1c3c1e-0b1a-4c3e-9a51-000000000002",
      type: "LotExpiring",
      title: "3 lotes vencem em até 30 dias",
      message: "Trufa de Maracujá, lote L-2611-07, vence em 12/11.",
      link: null,
      createdAt: "2026-11-07T09:00:00Z",
      readAt: null,
    },
    {
      id: "6f1c3c1e-0b1a-4c3e-9a51-000000000003",
      type: "LowStock",
      title: "5 variações abaixo do mínimo",
      message: "Bombom de Cereja está com 2 unidades.",
      link: "/products",
      createdAt: "2026-11-06T09:00:00Z",
      readAt: "2026-11-06T10:00:00Z",
    },
  ],
};
