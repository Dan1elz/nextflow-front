import { BaseService } from "./base.service";
import type {
  SupplierListItemDto,
  SupplierProductDto,
  SupplierRequestDto,
  SupplierResponseDto,
} from "@/interfaces/supplier.interface";

class SupplierService extends BaseService<
  SupplierResponseDto,
  SupplierRequestDto,
  SupplierListItemDto
> {
  /** Aba Produtos: produtos vinculados ao fornecedor. */
  getProducts(id: string, token?: string) {
    return this.apiService.get<SupplierProductDto[]>(
      `${this.endpoint}/${id}/products`,
      undefined,
      token
    );
  }
}

export const supplierService = new SupplierService("suppliers");
