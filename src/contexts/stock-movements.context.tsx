import { createContext } from "react";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type StockMovementsContextType = {
  stockMovements: IStockMovement[];
  selectedStockMovement: IStockMovement | null;
  pagination: IPaginationInfo | null;
  searchStockMovements: (query?: IIndexParams) => Promise<void>;
  searchStockMovementsForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: IStockMovement[]; totalItems: number }>;
  selectStockMovement: (id: string) => Promise<void>;
  getStockMovementById: (id: string) => Promise<IStockMovement>;
  createStockMovement: (stockMovement: Partial<IStockMovement>) => Promise<IStockMovement>;
  deleteStockMovement: (id: string) => Promise<void>;
};

export const StockMovementsContext = createContext<StockMovementsContextType | null>(null);
