import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type {
  IPurchaseOrder,
  ICreatePurchaseOrder,
  IUpdatePurchaseOrder,
} from "@/interfaces/purchase-order.interface";
import { PurchaseOrdersContext } from "@/contexts/purchase-orders.context";
import { purchaseOrderService } from "@/services/purchase-order.service";

export function PurchaseOrdersProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<IPurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState<IPurchaseOrder | null>(null);
  const { token } = useAuth();

  const searchPurchaseOrders = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await purchaseOrderService.getAll(
        query,
        token ?? undefined
      );
      setPurchaseOrders(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil((response.totalItems || 0) / perPage) || 1,
        total: response.totalItems || 0,
        perPage,
      });
    },
    [token]
  );

  const selectPurchaseOrder = useCallback(
    async (id: string): Promise<void> => {
      const data = await purchaseOrderService.getById(id, token ?? undefined);
      setSelectedPurchaseOrder(data);
    },
    [token]
  );

  const getPurchaseOrderById = useCallback(
    async (id: string): Promise<IPurchaseOrder> => {
      return purchaseOrderService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createPurchaseOrder = useCallback(
    async (purchaseOrder: ICreatePurchaseOrder): Promise<IPurchaseOrder> => {
      return await purchaseOrderService.create(
        purchaseOrder as Partial<IPurchaseOrder>,
        token ?? undefined
      );
    },
    [token]
  );

  const updatePurchaseOrder = useCallback(
    async (id: string, data: IUpdatePurchaseOrder): Promise<IPurchaseOrder> => {
      return await purchaseOrderService.update(
        id,
        data as unknown as IPurchaseOrder,
        token ?? undefined
      );
    },
    [token]
  );

  const deletePurchaseOrder = useCallback(
    async (id: string): Promise<void> => {
      await purchaseOrderService.deletePurchaseOrder(id, token ?? undefined);
    },
    [token]
  );

  return (
    <PurchaseOrdersContext.Provider
      value={{
        purchaseOrders,
        pagination,
        selectedPurchaseOrder,
        searchPurchaseOrders,
        selectPurchaseOrder,
        getPurchaseOrderById,
        createPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
      }}
    >
      {children}
    </PurchaseOrdersContext.Provider>
  );
}
