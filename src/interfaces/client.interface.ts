import type { AddressResponseDto } from "./address.interface";
import type { ContactResponseDto } from "./contact.interface";

export interface ClientRequestDto {
  name: string;
  lastName?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
}

export interface QuickCreateClientRequestDto {
  name: string;
  phone: string;
}

export interface ClientOptionDto {
  id: string;
  label: string;
  phone?: string | null;
}

/** `orderCount`, `totalSpent` e `lastPurchaseOn` ficam zero ou nulos até a fase 2. */
export interface ClientListItemDto {
  id: string;
  fullName: string;
  cpf?: string | null;
  birthDate?: string | null;
  mainPhone?: string | null;
  cityState?: string | null;
  orderCount: number;
  totalSpent: number;
  lastPurchaseOn?: string | null;
  isActive: boolean;
}

export interface ClientResponseDto {
  id: string;
  name: string;
  lastName?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  isActive: boolean;
  mainAddress?: AddressResponseDto | null;
  mainContact?: ContactResponseDto | null;
  orderCount: number;
  totalSpent: number;
  averageTicket: number;
  lastPurchaseOn?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Combo de cliente nas telas ainda não migradas (pedidos). */
export type ClientOption = Pick<ClientListItemDto, "id" | "fullName">;
