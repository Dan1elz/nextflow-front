import { createContext } from "react";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  OrderDetailDto,
  OrderListItemDto,
} from "@/interfaces/quick-sale.interface";

export type SalesHistoryContextType = {
  sales: OrderListItemDto[];
  pagination: IPaginationInfo | null;
  /** Vendas da loja selecionada no topo, mais recente primeiro. */
  searchSales: (query?: IIndexParams) => Promise<void>;
  getSale: (id: string) => Promise<OrderDetailDto>;
};

export const SalesHistoryContext = createContext<
  SalesHistoryContextType | undefined
>(undefined);
