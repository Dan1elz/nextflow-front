import type { IProduct } from "./product.interface";
import type { ISupplier } from "./supplier.interface";
import type { TPurchaseStatus } from "@/types/enums";

export interface IPurchaseItem {
  id?: string;
  purchaseOrderId: string;
  productId: string;
  product?: IProduct;
  quantity: number | string;
  discount: number | string;
  costPrice: number | string;
  createAt?: string;
}

export interface IPurchaseOrder {
  id?: string;
  supplierId: string;
  supplier?: ISupplier;
  status?: TPurchaseStatus;
  totalAmount?: number | string;
  note?: string;
  createAt?: string;
  updateAt?: string;
  active?: boolean;
  items?: IPurchaseItem[];
}

export interface ICreatePurchaseOrder {
  supplierId: string;
  note?: string;
  items: ICreatePurchaseItem[];
}

export interface ICreatePurchaseItem {
  productId: string;
  quantity: number;
  discount: number;
  costPrice: number;
}

export interface IUpdatePurchaseOrder {
  status?: TPurchaseStatus;
  note?: string;
  items?: ICreatePurchaseItem[];
}
