import { BaseService } from "./base.service";
import type {
  SupplierListItemDto,
  SupplierRequestDto,
  SupplierResponseDto,
} from "@/interfaces/supplier.interface";

export const supplierService = new BaseService<
  SupplierResponseDto,
  SupplierRequestDto,
  SupplierListItemDto
>("suppliers");
