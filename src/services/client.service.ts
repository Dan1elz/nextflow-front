import { BaseService } from "./base.service";
import type { IClient } from "@/interfaces/client.interface";

const baseService = new BaseService<IClient>("clients");

export const clientService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
