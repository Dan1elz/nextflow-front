/**
 * Enums da API antiga (branch task-17), ainda usados pelas telas não migradas.
 * Remova cada um quando o módulo for reescrito no padrão novo (os novos ficam em `enums.ts`, em string).
 */

/** UnitType - Unidade de medida de produto */
export const TUnitType = {
  Unit: 1,
  Kilogram: 2,
  Liter: 3,
  Meter: 4,
} as const;

export type TUnitType = (typeof TUnitType)[keyof typeof TUnitType];

export const UNIT_TYPE_LABELS: Record<TUnitType, string> = {
  [TUnitType.Unit]: "Unidade",
  [TUnitType.Kilogram]: "Quilograma",
  [TUnitType.Liter]: "Litro",
  [TUnitType.Meter]: "Metro",
};

/** OrderType - Tipo de pedido */
export const TOrderType = {
  Budget: 1,
  Sale: 2,
} as const;

export type TOrderType = (typeof TOrderType)[keyof typeof TOrderType];

export const ORDER_TYPE_LABELS: Record<TOrderType, string> = {
  [TOrderType.Budget]: "Orçamento",
  [TOrderType.Sale]: "Venda",
};

/** OrderStatus - Status do pedido */
export const TLegacyOrderStatus = {
  Budget: 1,
  PendingPayment: 2,
  PaymentConfirmed: 3,
  Canceled: 4,
  Refunded: 5,
} as const;

export type TLegacyOrderStatus =
  (typeof TLegacyOrderStatus)[keyof typeof TLegacyOrderStatus];

export const LEGACY_ORDER_STATUS_LABELS: Record<TLegacyOrderStatus, string> = {
  [TLegacyOrderStatus.Budget]: "Orçamento",
  [TLegacyOrderStatus.PendingPayment]: "Aguardando pagamento",
  [TLegacyOrderStatus.PaymentConfirmed]: "Pagamento confirmado",
  [TLegacyOrderStatus.Canceled]: "Pedido cancelado",
  [TLegacyOrderStatus.Refunded]: "Pedido reembolsado",
};

/** MovementType - Tipo de movimento de estoque */
export const TLegacyMovementType = {
  Entry: 1,
  Exit: 2,
  Adjustment: 3,
  Sales: 4,
  Return: 5,
} as const;

export type TLegacyMovementType =
  (typeof TLegacyMovementType)[keyof typeof TLegacyMovementType];

export const LEGACY_MOVEMENT_TYPE_LABELS: Record<TLegacyMovementType, string> =
  {
    [TLegacyMovementType.Entry]: "Entrada",
    [TLegacyMovementType.Exit]: "Remoção",
    [TLegacyMovementType.Adjustment]: "Ajuste",
    [TLegacyMovementType.Sales]: "Vendas",
    [TLegacyMovementType.Return]: "Retorno",
  };
/** PaymentMethod - Forma de pagamento */
export const TLegacyPaymentMethod = {
  Cash: 1,
  CreditCard: 2,
  DebitCard: 3,
  BankTransfer: 4,
  Pix: 5,
  Ticket: 6,
} as const;

export type TLegacyPaymentMethod =
  (typeof TLegacyPaymentMethod)[keyof typeof TLegacyPaymentMethod];

export const LEGACY_PAYMENT_METHOD_LABELS: Record<
  TLegacyPaymentMethod,
  string
> = {
  [TLegacyPaymentMethod.Cash]: "Dinheiro",
  [TLegacyPaymentMethod.CreditCard]: "Cartão de Crédito",
  [TLegacyPaymentMethod.DebitCard]: "Cartão de Débito",
  [TLegacyPaymentMethod.BankTransfer]: "Transferência Bancária",
  [TLegacyPaymentMethod.Pix]: "Pix",
  [TLegacyPaymentMethod.Ticket]: "Vale",
};

/** PurchaseStatus - Status do pedido de compra */
export const TLegacyPurchaseStatus = {
  Budget: 1,
  Pending: 2,
  Received: 3,
  Canceled: 4,
} as const;

export type TLegacyPurchaseStatus =
  (typeof TLegacyPurchaseStatus)[keyof typeof TLegacyPurchaseStatus];

export const LEGACY_PURCHASE_STATUS_LABELS: Record<
  TLegacyPurchaseStatus,
  string
> = {
  [TLegacyPurchaseStatus.Budget]: "Orçamento",
  [TLegacyPurchaseStatus.Pending]: "Pendente",
  [TLegacyPurchaseStatus.Received]: "Recebido",
  [TLegacyPurchaseStatus.Canceled]: "Cancelado",
};

/** PromotionSource - Origem da promoção */
export const TLegacyPromotionSource = {
  Manual: 1,
  AiRecommendation: 2,
} as const;

export type TLegacyPromotionSource =
  (typeof TLegacyPromotionSource)[keyof typeof TLegacyPromotionSource];

export const LEGACY_PROMOTION_SOURCE_LABELS: Record<
  TLegacyPromotionSource,
  string
> = {
  [TLegacyPromotionSource.Manual]: "Manual",
  [TLegacyPromotionSource.AiRecommendation]: "Recomendação da IA",
};

/** PromotionStatus - Status calculado da promoção (string no JSON) */
export const TLegacyPromotionStatus = {
  Active: "active",
  Scheduled: "scheduled",
  Ended: "ended",
  Canceled: "canceled",
} as const;

export type TLegacyPromotionStatus =
  (typeof TLegacyPromotionStatus)[keyof typeof TLegacyPromotionStatus];

export const LEGACY_PROMOTION_STATUS_LABELS: Record<
  TLegacyPromotionStatus,
  string
> = {
  [TLegacyPromotionStatus.Active]: "Vigente",
  [TLegacyPromotionStatus.Scheduled]: "Agendada",
  [TLegacyPromotionStatus.Ended]: "Encerrada",
  [TLegacyPromotionStatus.Canceled]: "Cancelada",
};

/** ForecastRunStatus - Status de uma análise de previsão */
export const TLegacyForecastRunStatus = {
  Completed: 1,
  CompletedWithoutAi: 2,
  Failed: 3,
} as const;

export type TLegacyForecastRunStatus =
  (typeof TLegacyForecastRunStatus)[keyof typeof TLegacyForecastRunStatus];

export const LEGACY_FORECAST_RUN_STATUS_LABELS: Record<
  TLegacyForecastRunStatus,
  string
> = {
  [TLegacyForecastRunStatus.Completed]: "Concluída",
  [TLegacyForecastRunStatus.CompletedWithoutAi]: "Concluída sem IA",
  [TLegacyForecastRunStatus.Failed]: "Falhou",
};

/** RecommendationAction - Ação recomendada */
export const TLegacyRecommendationAction = {
  Buy: 1,
  Promote: 2,
  Hold: 3,
} as const;

export type TLegacyRecommendationAction =
  (typeof TLegacyRecommendationAction)[keyof typeof TLegacyRecommendationAction];

export const LEGACY_RECOMMENDATION_ACTION_LABELS: Record<
  TLegacyRecommendationAction,
  string
> = {
  [TLegacyRecommendationAction.Buy]: "Comprar",
  [TLegacyRecommendationAction.Promote]: "Promover",
  [TLegacyRecommendationAction.Hold]: "Manter",
};

/** RecommendationPriority - Prioridade da recomendação */
export const TLegacyRecommendationPriority = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type TLegacyRecommendationPriority =
  (typeof TLegacyRecommendationPriority)[keyof typeof TLegacyRecommendationPriority];

export const LEGACY_RECOMMENDATION_PRIORITY_LABELS: Record<
  TLegacyRecommendationPriority,
  string
> = {
  [TLegacyRecommendationPriority.Low]: "Baixa",
  [TLegacyRecommendationPriority.Medium]: "Média",
  [TLegacyRecommendationPriority.High]: "Alta",
};

/** ForecastConfidence - Confiança da previsão */
export const TLegacyForecastConfidence = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type TLegacyForecastConfidence =
  (typeof TLegacyForecastConfidence)[keyof typeof TLegacyForecastConfidence];

export const LEGACY_FORECAST_CONFIDENCE_LABELS: Record<
  TLegacyForecastConfidence,
  string
> = {
  [TLegacyForecastConfidence.Low]: "Baixa",
  [TLegacyForecastConfidence.Medium]: "Média",
  [TLegacyForecastConfidence.High]: "Alta",
};

/** RecommendationStatus - Status da recomendação */
export const TLegacyRecommendationStatus = {
  Pending: 1,
  Applied: 2,
  Dismissed: 3,
  Expired: 4,
} as const;

export type TLegacyRecommendationStatus =
  (typeof TLegacyRecommendationStatus)[keyof typeof TLegacyRecommendationStatus];

export const LEGACY_RECOMMENDATION_STATUS_LABELS: Record<
  TLegacyRecommendationStatus,
  string
> = {
  [TLegacyRecommendationStatus.Pending]: "Pendente",
  [TLegacyRecommendationStatus.Applied]: "Aplicada",
  [TLegacyRecommendationStatus.Dismissed]: "Descartada",
  [TLegacyRecommendationStatus.Expired]: "Expirada",
};
