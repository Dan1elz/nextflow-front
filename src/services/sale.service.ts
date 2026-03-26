import { BaseService } from "./base.service";
import type { ISale } from "@/interfaces/sale.interface";
import { ApiService } from "./api.service";

const baseService = new BaseService<ISale>("sales");
const apiService = new ApiService();

export const saleService = {
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),

  deleteSale: async (id: string, token?: string): Promise<void> => {
    await apiService.delete(`sales/${id}`, token);
  },
};
