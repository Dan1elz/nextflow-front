import { createContext } from "react";
import type {
  IIndexParams,
  IOption,
  IPaginationInfo,
} from "@/interfaces/api.interface";
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
  /** Opções dos filtros (cliente, vendedor e produto), buscadas pelo termo digitado. */
  searchClientOptions: (search: string) => Promise<IOption[]>;
  searchUserOptions: (search: string) => Promise<IOption[]>;
  searchProductOptions: (search: string) => Promise<IOption[]>;
};

export const SalesHistoryContext = createContext<
  SalesHistoryContextType | undefined
>(undefined);
