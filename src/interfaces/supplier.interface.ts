import type { AddressResponseDto } from "./address.interface";
import type { ContactResponseDto } from "./contact.interface";

export interface SupplierRequestDto {
  name: string;
  cnpj: string;
  /** Prazo de entrega padrão em dias (1 a 180, padrão 7). */
  leadTimeDays: number;
  note?: string | null;
}

/** `realLeadTimeDays`, `productCount` e `lastPurchaseOn` ficam nulos ou zero até as fases 1 e 2. */
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

/** Combo e referência de fornecedor nas telas ainda não migradas (compras, produtos). */
export type SupplierOption = Pick<SupplierListItemDto, "id" | "name">;
