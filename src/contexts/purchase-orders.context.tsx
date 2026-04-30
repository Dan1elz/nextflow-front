import { createContext } from "react";
import type {
  IPurchaseOrder,
  ICreatePurchaseOrder,
  IUpdatePurchaseOrder,
} from "@/interfaces/purchase-order.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type PurchaseOrdersContextType = {
  purchaseOrders: IPurchaseOrder[];
  selectedPurchaseOrder: IPurchaseOrder | null;
  pagination: IPaginationInfo | null;
  searchPurchaseOrders: (query?: IIndexParams) => Promise<void>;
  selectPurchaseOrder: (id: string) => Promise<void>;
  getPurchaseOrderById: (id: string) => Promise<IPurchaseOrder>;
  createPurchaseOrder: (
    purchaseOrder: ICreatePurchaseOrder
  ) => Promise<IPurchaseOrder>;
  updatePurchaseOrder: (
    id: string,
    data: IUpdatePurchaseOrder
  ) => Promise<IPurchaseOrder>;
  deletePurchaseOrder: (id: string) => Promise<void>;
};

export const PurchaseOrdersContext =
  createContext<PurchaseOrdersContextType | null>(null);
