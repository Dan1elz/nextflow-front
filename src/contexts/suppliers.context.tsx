import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  SupplierListItemDto,
  SupplierRequestDto,
  SupplierResponseDto,
} from "@/interfaces/supplier.interface";

export type SuppliersContextType = {
  suppliers: SupplierListItemDto[];
  selectedSupplier: SupplierResponseDto | null;
  pagination: IPaginationInfo | null;
  searchSuppliers: (query?: IIndexParams) => Promise<void>;
  searchSuppliersForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: SupplierListItemDto[]; totalItems: number }>;
  selectSupplier: (id: string) => Promise<void>;
  getSupplierById: (id: string) => Promise<SupplierResponseDto>;
  createSupplier: (dto: SupplierRequestDto) => Promise<SupplierResponseDto>;
  updateSupplier: (
    id: string,
    dto: SupplierRequestDto
  ) => Promise<SupplierResponseDto>;
  deleteSupplier: (id: string) => Promise<void>;
  reactivateSupplier: (id: string) => Promise<void>;
};

export const SuppliersContext = createContext<SuppliersContextType | null>(
  null
);
