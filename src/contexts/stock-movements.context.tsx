import { createContext } from "react";

import type {
  IIndexParams,
  IOption,
  IPaginationInfo,
} from "@/interfaces/api.interface";
import type { StockMovementListItemDto } from "@/interfaces/stock-movement.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";

export type StockMovementsContextType = {
  stockMovements: StockMovementListItemDto[];
  pagination: IPaginationInfo | null;
  searchStockMovements: (query?: IIndexParams) => Promise<void>;
  getLocationOptions: (
    search?: string,
    storeId?: string | null
  ) => Promise<LocationOptionDto[]>;
  /** Filtro de produto: busca por nome, marca, SKU ou código de barras (até 20). */
  searchProductOptions: (search: string) => Promise<IOption[]>;
  /** Variações ativas do produto escolhido, para o filtro de variação. */
  getVariantOptions: (productId: string) => Promise<IOption[]>;
};

export const StockMovementsContext =
  createContext<StockMovementsContextType | null>(null);
