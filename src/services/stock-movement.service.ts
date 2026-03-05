import { BaseService } from "./base.service";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";

const baseService = new BaseService<IStockMovement>("StockMovements");

export const stockMovementService = {
  create: baseService.create.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  delete: baseService.delete.bind(baseService),
};
