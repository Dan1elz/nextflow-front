import { BaseService } from "./base.service";
import type { ICountry } from "@/interfaces/locations.interface";

const baseService = new BaseService<ICountry>("countries");

export const countryService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
