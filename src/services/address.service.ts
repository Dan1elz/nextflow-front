import { BaseService } from "./base.service";
import type {
  IAddress,
  IResolveAddressFromCepPayload,
  IResolveAddressFromCepResult,
} from "@/interfaces/address.interface";
import { ApiService } from "./api.service";

const baseService = new BaseService<IAddress>("addresses");
const apiService = new ApiService();

export const addressService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
  resolveFromCep: async (
    payload: IResolveAddressFromCepPayload,
    token?: string
  ) => {
    const response = await apiService.post<IResolveAddressFromCepResult>(
      "addresses/resolve-from-cep",
      payload,
      token
    );
    return response.data;
  },
};
