import { BaseService } from "./base.service";
import type { IAddress } from "@/interfaces/address.interface";
import { ApiService } from "./api.service";

const baseService = new BaseService<IAddress>("addresses");
const apiService = new ApiService();

export type ResolveAddressFromCepPayload = {
  stateAcronym?: string;
  cityName?: string;
  cityIbgeCode?: string;
};

export type ResolveAddressFromCepResult = {
  stateId?: string;
  stateName?: string;
  stateAcronym?: string;
  cityId?: string;
  cityName?: string;
  cityIbgeCode?: string;
};

export const addressService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
  resolveFromCep: async (
    payload: ResolveAddressFromCepPayload,
    token?: string
  ) => {
    const response = await apiService.post<ResolveAddressFromCepResult>(
      "addresses/resolve-from-cep",
      payload,
      token
    );
    return response.data;
  },
};
