import { createContext } from "react";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { ISale, ICreateSale } from "@/interfaces/sale.interface";

export type SalesContextType = {
  sales: ISale[];
  selectedSale: ISale | null;
  pagination: IPaginationInfo | null;
  searchSales: (query?: IIndexParams) => Promise<void>;
  searchSalesForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: ISale[]; totalItems: number }>;
  selectSale: (id: string) => Promise<void>;
  getSaleById: (id: string) => Promise<ISale>;
  createSale: (data: ICreateSale) => Promise<ISale>;
  deleteSale: (id: string) => Promise<void>;
};

export const SalesContext = createContext<SalesContextType | null>(null);
