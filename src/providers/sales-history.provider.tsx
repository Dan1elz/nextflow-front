import { useCallback, useState, type ReactNode } from "react";

import { SalesHistoryContext } from "@/contexts/sales-history.context";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { OrderListItemDto } from "@/interfaces/quick-sale.interface";
import { salesHistoryService } from "@/services/sales-history.service";

export function SalesHistoryProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<OrderListItemDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const auth = token ?? undefined;

  const searchSales = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await salesHistoryService.getAll(query, storeId, auth);
      setSales(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth, storeId]
  );

  const getSale = useCallback(
    (id: string) => salesHistoryService.getById(id, auth),
    [auth]
  );

  return (
    <SalesHistoryContext.Provider
      value={{ sales, pagination, searchSales, getSale }}
    >
      {children}
    </SalesHistoryContext.Provider>
  );
}
