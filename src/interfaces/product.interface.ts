import type { TUnitType } from "@/types/general";
import type { ISupplier } from "./supplier.interface";

export interface IProduct {
  categoryIds: (string | undefined)[] | undefined;
  id: string;
  supplierId: string;
  supplier?: ISupplier;
  productCode: string;
  name: string;
  description: string;
  image?: string;
  quantity: string;
  unitType: TUnitType;
  price: string;
  validity?: string;
  // categories?: ICategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IProductRequest {
  id?: string;
  supplierId?: string;
  productCode: string;
  name: string;
  description: string;
  image?: File | null;
  categoryIds?: string[];
  quantity: string;
  unitType: TUnitType;
  price: string;
  validity?: string;
}
