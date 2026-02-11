import { createContext } from "react";
import type { ISupplier } from "@/interfaces/supplier.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type SuppliersContextType = {
  suppliers: ISupplier[];
  selectedSupplier: ISupplier | null;
  pagination: IPaginationInfo | null;
  searchSuppliers: (query?: IIndexParams) => Promise<void>;
  searchSuppliersForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: ISupplier[]; totalItems: number }>;
  selectSupplier: (id: string) => Promise<void>;
  getSupplierById: (id: string) => Promise<ISupplier>;
  createSupplier: (supplier: ISupplier) => Promise<ISupplier>;
  updateSupplier: (id: string, supplier: ISupplier) => Promise<ISupplier>;
  deleteSupplier: (id: string) => Promise<void>;
};

export const SuppliersContext = createContext<SuppliersContextType | null>(
  null
);
