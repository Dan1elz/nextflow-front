import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { ISale, ICreateSale } from "@/interfaces/sale.interface";
import { SalesContext } from "@/contexts/sales.context";
import { saleService } from "@/services/sale.service";

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<ISale[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const { token } = useAuth();

  const searchSales = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await saleService.getAll(query, token ?? undefined);
      setSales(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil((response.totalItems || 0) / perPage) || 1,
        total: response.totalItems || 0,
        perPage,
      });
    },
    [token]
  );

  const selectSale = useCallback(
    async (id: string): Promise<void> => {
      const data = await saleService.getById(id, token ?? undefined);
      setSelectedSale(data);
    },
    [token]
  );

  const getSaleById = useCallback(
    async (id: string): Promise<ISale> => {
      return saleService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createSale = useCallback(
    async (data: ICreateSale): Promise<ISale> => {
      return await saleService.create(
        data as Partial<ISale>,
        token ?? undefined
      );
    },
    [token]
  );

  const deleteSale = useCallback(
    async (id: string): Promise<void> => {
      await saleService.deleteSale(id, token ?? undefined);
    },
    [token]
  );

  return (
    <SalesContext.Provider
      value={{
        sales,
        pagination,
        selectedSale,
        searchSales,
        selectSale,
        getSaleById,
        createSale,
        deleteSale,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}
