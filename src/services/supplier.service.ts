import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type { ISupplier } from "@/interfaces/supplier.interface";

const baseService = new BaseService<ISupplier>("suppliers");
const apiService = new ApiService();

export const supplierService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
  reactivate: async (id: string, token?: string) => {
    const response = await apiService.patch<ISupplier>(
      `suppliers/reactivate/${id}`,
      {},
      token
    );
    return response;
  },
};
