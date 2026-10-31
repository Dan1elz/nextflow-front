import type { TUnitType } from "@/types/enums";
import type { ICategory } from "./category.interface";
import type { SupplierOption } from "./supplier.interface";
import type { IPromotionSummary } from "./promotion.interface";

export interface IProduct {
  id?: string;
  supplierId: string;
  supplier?: SupplierOption;
  productCode: string;
  name: string;
  description: string;
  brand?: string | null;
  image?: string | File | null;
  categoryIds?: string[];
  categories?: ICategory[];
  quantity: number | string;
  unitType: TUnitType;
  price: number | string;
  costPrice?: number | string | null;
  minStock?: number | string;
  /** Preço com a promoção vigente aplicada (= price quando não há promoção). Calculado pela API. */
  effectivePrice?: number;
  /** Promoção vigente hoje, se houver. */
  activePromotion?: IPromotionSummary | null;
  validity?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
