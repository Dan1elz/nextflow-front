import { BaseService } from "./base.service";
import type { IState } from "@/interfaces/locations.interface";

const baseService = new BaseService<IState>("states");

export const stateService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
