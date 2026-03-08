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
