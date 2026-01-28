import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type { IClient } from "@/interfaces/client.interface";

const baseService = new BaseService<IClient>("clients");
const apiService = new ApiService();

export const clientService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
  reactivate: async (id: string, token?: string) => {
    const response = await apiService.patch<IClient>(
      `clients/reactivate/${id}`,
      {},
      token
    );
    return response;
  },
};
