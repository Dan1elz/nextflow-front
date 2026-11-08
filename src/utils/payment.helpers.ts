import {
  Banknote,
  CreditCard,
  Landmark,
  type LucideIcon,
  QrCode,
  Wallet,
} from "lucide-react";

import type { TPaymentMethod } from "@/types/enums";

/** Ícone de cada forma de pagamento (venda rápida e detalhe da venda). */
export const PAYMENT_ICONS: Record<TPaymentMethod, LucideIcon> = {
  Cash: Banknote,
  CreditCard: CreditCard,
  DebitCard: Wallet,
  BankTransfer: Landmark,
  Pix: QrCode,
};

/** Rótulo curto para botões estreitos (o rótulo completo fica no `title`). */
export const PAYMENT_SHORT_LABELS: Record<TPaymentMethod, string> = {
  Cash: "Dinheiro",
  CreditCard: "Crédito",
  DebitCard: "Débito",
  BankTransfer: "Transferência",
  Pix: "Pix",
};
