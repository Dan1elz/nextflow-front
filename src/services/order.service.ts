import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type { IOrder } from "@/interfaces/order.interface";

const baseService = new BaseService<IOrder>("orders");
const apiService = new ApiService();

export const orderService = {
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),

  cancelOrder: async (id: string, reason: string, token?: string): Promise<void> => {
    await apiService.delete(`orders/${id}`, token, { reason });
  },

  refundOrder: async (id: string, reason: string, token?: string): Promise<void> => {
    await apiService.patch(`orders/${id}/refund`, { reason }, token);
  },
};
