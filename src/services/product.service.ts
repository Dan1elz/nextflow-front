import { BaseService } from "./base.service";
import type { IProduct } from "@/interfaces/product.interface";

const baseService = new BaseService<IProduct>("products");

export const productService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
