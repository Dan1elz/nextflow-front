import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { IOrder, IUpdateOrder } from "@/interfaces/order.interface";
import { OrdersContext } from "@/contexts/orders.context";
import { orderService } from "@/services/order.service";

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const { token } = useAuth();

  const searchOrders = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await orderService.getAll(query, token ?? undefined);
      setOrders(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil((response.totalItems || 0) / perPage) || 1,
        total: response.totalItems || 0,
        perPage,
      });
    },
    [token]
  );

  const selectOrder = useCallback(
    async (id: string): Promise<void> => {
      const data = await orderService.getById(id, token ?? undefined);
      setSelectedOrder(data);
    },
    [token]
  );

  const getOrderById = useCallback(
    async (id: string): Promise<IOrder> => {
      return orderService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createOrder = useCallback(
    async (order: Partial<IOrder>): Promise<IOrder> => {
      return await orderService.create(order, token ?? undefined);
    },
    [token]
  );

  const updateOrder = useCallback(
    async (id: string, data: IUpdateOrder): Promise<IOrder> => {
      return await orderService.update(id, data, token ?? undefined);
    },
    [token]
  );

  const cancelOrder = useCallback(
    async (id: string, reason: string): Promise<void> => {
      await orderService.cancelOrder(id, reason, token ?? undefined);
    },
    [token]
  );

  return (
    <OrdersContext.Provider
      value={{
        orders,
        pagination,
        selectedOrder,
        searchOrders,
        selectOrder,
        getOrderById,
        createOrder,
        updateOrder,
        cancelOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}
