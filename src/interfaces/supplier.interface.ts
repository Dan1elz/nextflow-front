import type { AddressResponseDto } from "./address.interface";
import type { ContactResponseDto } from "./contact.interface";
import type { TLifecycle } from "@/types/enums";

export interface SupplierRequestDto {
  name: string;
  cnpj: string;
  /** Prazo de entrega padrão em dias (1 a 180, padrão 7). */
  leadTimeDays: number;
  note?: string | null;
}

/** `realLeadTimeDays` (média dos recebidos) e `lastPurchaseOn` (último envio) vêm dos pedidos de compra; nulos sem pedido. */
export interface SupplierListItemDto {
  id: string;
  name: string;
  cnpj: string;
  cityState?: string | null;
  mainContact?: string | null;
  leadTimeDays: number;
  realLeadTimeDays?: number | null;
  productCount: number;
  lastPurchaseOn?: string | null;
  isActive: boolean;
}

export interface SupplierResponseDto {
  id: string;
  name: string;
  cnpj: string;
  leadTimeDays: number;
  note?: string | null;
  isActive: boolean;
  realLeadTimeDays?: number | null;
  mainAddress?: AddressResponseDto | null;
  mainContact?: ContactResponseDto | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Linha da aba Produtos do fornecedor: o vínculo produto × fornecedor. `leadTimeDays` é o efetivo (RN-CE60). */
export interface SupplierProductDto {
  productId: string;
  productName: string;
  brand?: string | null;
  productIsActive: boolean;
  lifecycle: TLifecycle;
  isPreferred: boolean;
  supplierSku?: string | null;
  leadTimeDays: number;
  minOrderQty?: number | null;
  orderMultiple?: number | null;
  lastCost?: number | null;
}

/** Combo e referência de fornecedor nas telas ainda não migradas (compras, produtos). */
export type SupplierOption = Pick<SupplierListItemDto, "id" | "name">;
