/**
 * Enums alinhados aos do backend (Nextflow.Domain.Enums).
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

/** RoleEnum - Papel do usuário */
export const TRoleEnum = {
  User: 1,
  Admin: 2,
} as const;

export type TRoleEnum = (typeof TRoleEnum)[keyof typeof TRoleEnum];

export const ROLE_ENUM_LABELS: Record<TRoleEnum, string> = {
  [TRoleEnum.User]: "Usuário",
  [TRoleEnum.Admin]: "Administrador",
};

/** PaymentMethod - Forma de pagamento */
export const TPaymentMethod = {
  Cash: 1,
  CreditCard: 2,
  DebitCard: 3,
  BankTransfer: 4,
  Pix: 5,
  Ticket: 6,
} as const;

export type TPaymentMethod =
  (typeof TPaymentMethod)[keyof typeof TPaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<TPaymentMethod, string> = {
  [TPaymentMethod.Cash]: "Dinheiro",
  [TPaymentMethod.CreditCard]: "Cartão de Crédito",
  [TPaymentMethod.DebitCard]: "Cartão de Débito",
  [TPaymentMethod.BankTransfer]: "Transferência Bancária",
  [TPaymentMethod.Pix]: "Pix",
  [TPaymentMethod.Ticket]: "Vale",
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
export const TOrderStatus = {
  Budget: 1,
  PendingPayment: 2,
  PaymentConfirmed: 3,
  Canceled: 4,
  Refunded: 5,
} as const;

export type TOrderStatus = (typeof TOrderStatus)[keyof typeof TOrderStatus];

export const ORDER_STATUS_LABELS: Record<TOrderStatus, string> = {
  [TOrderStatus.Budget]: "Orçamento",
  [TOrderStatus.PendingPayment]: "Aguardando pagamento",
  [TOrderStatus.PaymentConfirmed]: "Pagamento confirmado",
  [TOrderStatus.Canceled]: "Pedido cancelado",
  [TOrderStatus.Refunded]: "Pedido reembolsado",
};

/** MovementType - Tipo de movimento de estoque */
export const TMovementType = {
  Entry: 1,
  Exit: 2,
  Adjustment: 3,
  Sales: 4,
  Return: 5,
} as const;

export type TMovementType = (typeof TMovementType)[keyof typeof TMovementType];

export const MOVEMENT_TYPE_LABELS: Record<TMovementType, string> = {
  [TMovementType.Entry]: "Entrada",
  [TMovementType.Exit]: "Remoção",
  [TMovementType.Adjustment]: "Ajuste",
  [TMovementType.Sales]: "Vendas",
  [TMovementType.Return]: "Retorno",
};

/** PurchaseStatus - Status do pedido de compra */
export const TPurchaseStatus = {
  Budget: 1,
  Pending: 2,
  Received: 3,
  Canceled: 4,
} as const;

export type TPurchaseStatus =
  (typeof TPurchaseStatus)[keyof typeof TPurchaseStatus];

export const PURCHASE_STATUS_LABELS: Record<TPurchaseStatus, string> = {
  [TPurchaseStatus.Budget]: "Orçamento",
  [TPurchaseStatus.Pending]: "Pendente",
  [TPurchaseStatus.Received]: "Recebido",
  [TPurchaseStatus.Canceled]: "Cancelado",
};

/** PromotionSource - Origem da promoção */
export const TPromotionSource = {
  Manual: 1,
  AiRecommendation: 2,
} as const;

export type TPromotionSource =
  (typeof TPromotionSource)[keyof typeof TPromotionSource];

export const PROMOTION_SOURCE_LABELS: Record<TPromotionSource, string> = {
  [TPromotionSource.Manual]: "Manual",
  [TPromotionSource.AiRecommendation]: "Recomendação da IA",
};

/** PromotionStatus - Status calculado da promoção (string no JSON) */
export const TPromotionStatus = {
  Active: "active",
  Scheduled: "scheduled",
  Ended: "ended",
  Canceled: "canceled",
} as const;

export type TPromotionStatus =
  (typeof TPromotionStatus)[keyof typeof TPromotionStatus];

export const PROMOTION_STATUS_LABELS: Record<TPromotionStatus, string> = {
  [TPromotionStatus.Active]: "Vigente",
  [TPromotionStatus.Scheduled]: "Agendada",
  [TPromotionStatus.Ended]: "Encerrada",
  [TPromotionStatus.Canceled]: "Cancelada",
};

/** ForecastRunStatus - Status de uma análise de previsão */
export const TForecastRunStatus = {
  Completed: 1,
  CompletedWithoutAi: 2,
  Failed: 3,
} as const;

export type TForecastRunStatus =
  (typeof TForecastRunStatus)[keyof typeof TForecastRunStatus];

export const FORECAST_RUN_STATUS_LABELS: Record<TForecastRunStatus, string> = {
  [TForecastRunStatus.Completed]: "Concluída",
  [TForecastRunStatus.CompletedWithoutAi]: "Concluída sem IA",
  [TForecastRunStatus.Failed]: "Falhou",
};

/** RecommendationAction - Ação recomendada */
export const TRecommendationAction = {
  Buy: 1,
  Promote: 2,
  Hold: 3,
} as const;

export type TRecommendationAction =
  (typeof TRecommendationAction)[keyof typeof TRecommendationAction];

export const RECOMMENDATION_ACTION_LABELS: Record<
  TRecommendationAction,
  string
> = {
  [TRecommendationAction.Buy]: "Comprar",
  [TRecommendationAction.Promote]: "Promover",
  [TRecommendationAction.Hold]: "Manter",
};

/** RecommendationPriority - Prioridade da recomendação */
export const TRecommendationPriority = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type TRecommendationPriority =
  (typeof TRecommendationPriority)[keyof typeof TRecommendationPriority];

export const RECOMMENDATION_PRIORITY_LABELS: Record<
  TRecommendationPriority,
  string
> = {
  [TRecommendationPriority.Low]: "Baixa",
  [TRecommendationPriority.Medium]: "Média",
  [TRecommendationPriority.High]: "Alta",
};

/** ForecastConfidence - Confiança da previsão */
export const TForecastConfidence = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type TForecastConfidence =
  (typeof TForecastConfidence)[keyof typeof TForecastConfidence];

export const FORECAST_CONFIDENCE_LABELS: Record<TForecastConfidence, string> = {
  [TForecastConfidence.Low]: "Baixa",
  [TForecastConfidence.Medium]: "Média",
  [TForecastConfidence.High]: "Alta",
};

/** RecommendationStatus - Status da recomendação */
export const TRecommendationStatus = {
  Pending: 1,
  Applied: 2,
  Dismissed: 3,
  Expired: 4,
} as const;

export type TRecommendationStatus =
  (typeof TRecommendationStatus)[keyof typeof TRecommendationStatus];

export const RECOMMENDATION_STATUS_LABELS: Record<
  TRecommendationStatus,
  string
> = {
  [TRecommendationStatus.Pending]: "Pendente",
  [TRecommendationStatus.Applied]: "Aplicada",
  [TRecommendationStatus.Dismissed]: "Descartada",
  [TRecommendationStatus.Expired]: "Expirada",
};
