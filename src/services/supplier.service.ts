import { BaseService } from "./base.service";
import type { ISupplier } from "@/interfaces/supplier.interface";

const baseService = new BaseService<ISupplier>("suppliers");

export const supplierService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
