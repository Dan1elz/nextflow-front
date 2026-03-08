import { createContext } from "react";
import type { IOrder, IUpdateOrder } from "@/interfaces/order.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type OrdersContextType = {
  orders: IOrder[];
  selectedOrder: IOrder | null;
  pagination: IPaginationInfo | null;
  searchOrders: (query?: IIndexParams) => Promise<void>;
  selectOrder: (id: string) => Promise<void>;
  getOrderById: (id: string) => Promise<IOrder>;
  createOrder: (order: Partial<IOrder>) => Promise<IOrder>;
  updateOrder: (id: string, data: IUpdateOrder) => Promise<IOrder>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
};

export const OrdersContext = createContext<OrdersContextType | null>(null);
