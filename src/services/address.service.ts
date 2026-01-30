import { BaseService } from "./base.service";
import type { IAddress } from "@/interfaces/address.interface";

const baseService = new BaseService<IAddress>("addresses");

export const addressService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
