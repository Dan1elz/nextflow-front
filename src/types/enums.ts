/**
 * Enums da API nova (ADR 0010): trafegam como string, com a chave igual ao `GetApiName()` do backend
 * (`nextflow/nextflow.Domain/Enums`). Cada enum tem o label pt-BR ao lado. Mudou na API, muda aqui.
 * Fonte: seção "Enums" do `contract.md` de cada módulo em `nextflow-docs`.
 * Enums da API antiga, ainda usados por telas não migradas: `legacy-enums.ts`.
 */

// ---------- Acesso ----------

/** Perfil do usuário. Só Admin em uso (ADR 0004). */
export const TRoleEnum = {
  User: "User",
  Admin: "Admin",
} as const;
export type TRoleEnum = (typeof TRoleEnum)[keyof typeof TRoleEnum];
export const ROLE_ENUM_LABELS: Record<TRoleEnum, string> = {
  User: "Usuário",
  Admin: "Administrador",
};

// ---------- Cadastros ----------

/** Tipo de contato de cliente/fornecedor. */
export const TContactType = {
  Phone: "Phone",
  Email: "Email",
  WhatsApp: "WhatsApp",
} as const;
export type TContactType = (typeof TContactType)[keyof typeof TContactType];
export const CONTACT_TYPE_LABELS: Record<TContactType, string> = {
  Phone: "Telefone",
  Email: "E-mail",
  WhatsApp: "WhatsApp",
};

/** Dono de endereço/contato (associação polimórfica). */
export const TOwnerType = {
  Client: "Client",
  Supplier: "Supplier",
} as const;
export type TOwnerType = (typeof TOwnerType)[keyof typeof TOwnerType];
export const OWNER_TYPE_LABELS: Record<TOwnerType, string> = {
  Client: "Cliente",
  Supplier: "Fornecedor",
};

// ---------- Catálogo e estoque ----------

export const TProductType = {
  Standard: "Standard",
  Apparel: "Apparel",
  Perishable: "Perishable",
  Bulk: "Bulk",
} as const;
export type TProductType = (typeof TProductType)[keyof typeof TProductType];
export const PRODUCT_TYPE_LABELS: Record<TProductType, string> = {
  Standard: "Padrão",
  Apparel: "Vestuário",
  Perishable: "Perecível",
  Bulk: "A granel",
};

export const TLifecycle = {
  Active: "Active",
  Discontinued: "Discontinued",
} as const;
export type TLifecycle = (typeof TLifecycle)[keyof typeof TLifecycle];
export const LIFECYCLE_LABELS: Record<TLifecycle, string> = {
  Active: "Em linha",
  Discontinued: "Fora de linha",
};

export const TSaleUnit = {
  Unit: "Unit",
  Kilogram: "Kilogram",
  Liter: "Liter",
  Meter: "Meter",
} as const;
export type TSaleUnit = (typeof TSaleUnit)[keyof typeof TSaleUnit];
export const SALE_UNIT_LABELS: Record<TSaleUnit, string> = {
  Unit: "Unidade",
  Kilogram: "Quilograma",
  Liter: "Litro",
  Meter: "Metro",
};

export const TMovementType = {
  In: "In",
  Out: "Out",
} as const;
export type TMovementType = (typeof TMovementType)[keyof typeof TMovementType];
export const MOVEMENT_TYPE_LABELS: Record<TMovementType, string> = {
  In: "Entrada",
  Out: "Saída",
};

export const TMovementReason = {
  Opening: "Opening",
  Purchase: "Purchase",
  Sale: "Sale",
  CustomerReturn: "CustomerReturn",
  SupplierReturn: "SupplierReturn",
  TransferIn: "TransferIn",
  TransferOut: "TransferOut",
  CountAdjustment: "CountAdjustment",
  Adjustment: "Adjustment",
  Breakage: "Breakage",
  Expired: "Expired",
  Theft: "Theft",
  InternalUse: "InternalUse",
} as const;
export type TMovementReason =
  (typeof TMovementReason)[keyof typeof TMovementReason];
export const MOVEMENT_REASON_LABELS: Record<TMovementReason, string> = {
  Opening: "Saldo de abertura",
  Purchase: "Compra",
  Sale: "Venda",
  CustomerReturn: "Devolução de cliente",
  SupplierReturn: "Devolução ao fornecedor",
  TransferIn: "Transferência (entrada)",
  TransferOut: "Transferência (saída)",
  CountAdjustment: "Ajuste de inventário",
  Adjustment: "Ajuste",
  Breakage: "Avaria",
  Expired: "Vencido",
  Theft: "Furto",
  InternalUse: "Uso interno",
};

export const TSourceType = {
  Order: "Order",
  PurchaseOrder: "PurchaseOrder",
  Transfer: "Transfer",
  InventoryCount: "InventoryCount",
  Manual: "Manual",
} as const;
export type TSourceType = (typeof TSourceType)[keyof typeof TSourceType];
export const SOURCE_TYPE_LABELS: Record<TSourceType, string> = {
  Order: "Pedido",
  PurchaseOrder: "Pedido de compra",
  Transfer: "Transferência",
  InventoryCount: "Inventário",
  Manual: "Manual",
};

export const TTransferStatus = {
  Draft: "Draft",
  Sent: "Sent",
  Received: "Received",
  Canceled: "Canceled",
} as const;
export type TTransferStatus =
  (typeof TTransferStatus)[keyof typeof TTransferStatus];
export const TRANSFER_STATUS_LABELS: Record<TTransferStatus, string> = {
  Draft: "Rascunho",
  Sent: "Enviada",
  Received: "Recebida",
  Canceled: "Cancelada",
};

export const TInventoryStatus = {
  Open: "Open",
  Closed: "Closed",
  Canceled: "Canceled",
} as const;
export type TInventoryStatus =
  (typeof TInventoryStatus)[keyof typeof TInventoryStatus];
export const INVENTORY_STATUS_LABELS: Record<TInventoryStatus, string> = {
  Open: "Aberto",
  Closed: "Fechado",
  Canceled: "Cancelado",
};

export const TEventScope = {
  National: "National",
  Company: "Company",
} as const;
export type TEventScope = (typeof TEventScope)[keyof typeof TEventScope];
export const EVENT_SCOPE_LABELS: Record<TEventScope, string> = {
  National: "Nacional",
  Company: "Da empresa",
};

export const TDateRule = {
  Fixed: "Fixed",
  Easter: "Easter",
  NthWeekday: "NthWeekday",
  BlackFriday: "BlackFriday",
  EasterOffset: "EasterOffset",
} as const;
export type TDateRule = (typeof TDateRule)[keyof typeof TDateRule];
export const DATE_RULE_LABELS: Record<TDateRule, string> = {
  Fixed: "Data fixa",
  Easter: "Páscoa",
  NthWeekday: "Enésimo dia da semana",
  BlackFriday: "Black Friday",
  EasterOffset: "Dias a partir da Páscoa",
};

// ---------- Vendas ----------

export const TOrderStatus = {
  Budget: "Budget",
  Paid: "Paid",
  Canceled: "Canceled",
  Refunded: "Refunded",
  Expired: "Expired",
} as const;
export type TOrderStatus = (typeof TOrderStatus)[keyof typeof TOrderStatus];
export const ORDER_STATUS_LABELS: Record<TOrderStatus, string> = {
  Budget: "Orçamento",
  Paid: "Paga",
  Canceled: "Cancelado",
  Refunded: "Reembolsada",
  Expired: "Expirado",
};

export const TOrderChannel = {
  Counter: "Counter",
  Order: "Order",
} as const;
export type TOrderChannel = (typeof TOrderChannel)[keyof typeof TOrderChannel];
export const ORDER_CHANNEL_LABELS: Record<TOrderChannel, string> = {
  Counter: "Balcão",
  Order: "Pedido",
};

/** Forma de pagamento. Sem boleto (RN-VD20). */
export const TPaymentMethod = {
  Cash: "Cash",
  CreditCard: "CreditCard",
  DebitCard: "DebitCard",
  BankTransfer: "BankTransfer",
  Pix: "Pix",
} as const;
export type TPaymentMethod =
  (typeof TPaymentMethod)[keyof typeof TPaymentMethod];
export const PAYMENT_METHOD_LABELS: Record<TPaymentMethod, string> = {
  Cash: "Dinheiro",
  CreditCard: "Cartão de crédito",
  DebitCard: "Cartão de débito",
  BankTransfer: "Transferência bancária",
  Pix: "Pix",
};

export const TPromotionStatus = {
  Scheduled: "Scheduled",
  Active: "Active",
  Ended: "Ended",
  Canceled: "Canceled",
} as const;
export type TPromotionStatus =
  (typeof TPromotionStatus)[keyof typeof TPromotionStatus];
export const PROMOTION_STATUS_LABELS: Record<TPromotionStatus, string> = {
  Scheduled: "Agendada",
  Active: "Vigente",
  Ended: "Encerrada",
  Canceled: "Cancelada",
};

export const TPromotionSource = {
  Manual: "Manual",
  AiRecommendation: "AiRecommendation",
} as const;
export type TPromotionSource =
  (typeof TPromotionSource)[keyof typeof TPromotionSource];
export const PROMOTION_SOURCE_LABELS: Record<TPromotionSource, string> = {
  Manual: "Manual",
  AiRecommendation: "Recomendação da IA",
};

// ---------- Compras ----------

export const TPurchaseStatus = {
  Budget: "Budget",
  Pending: "Pending",
  Received: "Received",
  Canceled: "Canceled",
} as const;
export type TPurchaseStatus =
  (typeof TPurchaseStatus)[keyof typeof TPurchaseStatus];
export const PURCHASE_STATUS_LABELS: Record<TPurchaseStatus, string> = {
  Budget: "Orçamento",
  Pending: "Pendente",
  Received: "Recebido",
  Canceled: "Cancelado",
};

// ---------- Previsão ----------

export const TForecastRunStatus = {
  Completed: "Completed",
  CompletedWithoutAi: "CompletedWithoutAi",
  Failed: "Failed",
  Running: "Running",
} as const;
export type TForecastRunStatus =
  (typeof TForecastRunStatus)[keyof typeof TForecastRunStatus];
export const FORECAST_RUN_STATUS_LABELS: Record<TForecastRunStatus, string> = {
  Completed: "Concluída",
  CompletedWithoutAi: "Concluída sem IA",
  Failed: "Falhou",
  Running: "Em andamento",
};

export const TForecastTrigger = {
  Manual: "Manual",
  Scheduled: "Scheduled",
} as const;
export type TForecastTrigger =
  (typeof TForecastTrigger)[keyof typeof TForecastTrigger];
export const FORECAST_TRIGGER_LABELS: Record<TForecastTrigger, string> = {
  Manual: "Manual",
  Scheduled: "Semanal",
};

export const TRecommendationAction = {
  Buy: "Buy",
  Promote: "Promote",
  Hold: "Hold",
  Transfer: "Transfer",
} as const;
export type TRecommendationAction =
  (typeof TRecommendationAction)[keyof typeof TRecommendationAction];
export const RECOMMENDATION_ACTION_LABELS: Record<
  TRecommendationAction,
  string
> = {
  Buy: "Comprar",
  Promote: "Promover",
  Hold: "Manter",
  Transfer: "Transferir",
};

export const TRecommendationPriority = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
} as const;
export type TRecommendationPriority =
  (typeof TRecommendationPriority)[keyof typeof TRecommendationPriority];
export const RECOMMENDATION_PRIORITY_LABELS: Record<
  TRecommendationPriority,
  string
> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
};

export const TForecastConfidence = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
} as const;
export type TForecastConfidence =
  (typeof TForecastConfidence)[keyof typeof TForecastConfidence];
export const FORECAST_CONFIDENCE_LABELS: Record<TForecastConfidence, string> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
};

export const TRecommendationStatus = {
  Pending: "Pending",
  Applied: "Applied",
  Dismissed: "Dismissed",
  Expired: "Expired",
} as const;
export type TRecommendationStatus =
  (typeof TRecommendationStatus)[keyof typeof TRecommendationStatus];
export const RECOMMENDATION_STATUS_LABELS: Record<
  TRecommendationStatus,
  string
> = {
  Pending: "Pendente",
  Applied: "Aplicada",
  Dismissed: "Descartada",
  Expired: "Expirada",
};

// Enums da API antiga, só para as telas ainda não migradas (sai junto com elas).
export * from "./legacy-enums";
