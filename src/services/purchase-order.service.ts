import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type { IPurchaseOrder } from "@/interfaces/purchase-order.interface";

const baseService = new BaseService<IPurchaseOrder>("PurchaseOrders");
const apiService = new ApiService();

export const purchaseOrderService = {
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),

  deletePurchaseOrder: async (id: string, token?: string): Promise<void> => {
    await apiService.delete(`PurchaseOrders/${id}`, token);
  },
};
