import { BaseService } from "./base.service";
import type { ICategory } from "@/interfaces/category.interface"; 

const baseService = new BaseService<ICategory>("categories");

export const categoryService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
};
