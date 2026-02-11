import type { TUnitType } from "@/types/enums";
import type { ICategory } from "./category.interface";
import type { ISupplier } from "./supplier.interface";

export interface IProduct {
  id?: string;
  supplierId: string;
  supplier?: ISupplier;
  productCode: string;
  name: string;
  description: string;
  image?: string | File | null;
  categoryIds?: string[];
  categories?: ICategory[];
  quantity: number | string;
  unitType: TUnitType;
  price: number | string;
  validity?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
