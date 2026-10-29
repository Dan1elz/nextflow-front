import type { IProduct } from "./product.interface";
import type { IUser } from "./user.interface";
import type { TLegacyMovementType } from "@/types/enums";

export interface IStockMovement {
  id?: string;
  description?: string;
  productId: string;
  product?: IProduct;
  userId: string;
  user?: IUser;
  movementType: TLegacyMovementType;
  quantity: number | string;
  quote: number | string;
  createAt?: string;
}
