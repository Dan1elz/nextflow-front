import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";
import { StockMovementsContext } from "@/contexts/stock-movements.context";
import { stockMovementService } from "@/services/stock-movement.service";

export function StockMovementsProvider({ children }: { children: ReactNode }) {
  const [stockMovements, setStockMovements] = useState<IStockMovement[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedStockMovement, setSelectedStockMovement] =
    useState<IStockMovement | null>(null);
  const { token } = useAuth();

  const searchStockMovements = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await stockMovementService.getAll(
        query,
        token ?? undefined
      );
      setStockMovements(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil((response.totalItems || 0) / perPage) || 1,
        total: response.totalItems || 0,
        perPage,
      });
    },
    [token]
  );

  const searchStockMovementsForOptions = useCallback(
    async (
      query?: IIndexParams
    ): Promise<{ data: IStockMovement[]; totalItems: number }> => {
      const response = await stockMovementService.getAll(
        query,
        token ?? undefined
      );
      return {
        data: response.data || [],
        totalItems: response.totalItems || 0,
      };
    },
    [token]
  );

  const selectStockMovement = useCallback(
    async (id: string): Promise<void> => {
      const data = await stockMovementService.getById(id, token ?? undefined);
      setSelectedStockMovement(data);
    },
    [token]
  );

  const getStockMovementById = useCallback(
    async (id: string): Promise<IStockMovement> => {
      return stockMovementService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createStockMovement = useCallback(
    async (stockMovement: Partial<IStockMovement>): Promise<IStockMovement> => {
      const data = await stockMovementService.create(
        stockMovement,
        token ?? undefined
      );
      return data;
    },
    [token]
  );

  const deleteStockMovement = useCallback(
    async (id: string): Promise<void> => {
      await stockMovementService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <StockMovementsContext.Provider
      value={{
        stockMovements,
        pagination,
        selectedStockMovement,
        searchStockMovements,
        searchStockMovementsForOptions,
        selectStockMovement,
        getStockMovementById,
        createStockMovement,
        deleteStockMovement,
      }}
    >
      {children}
    </StockMovementsContext.Provider>
  );
}
