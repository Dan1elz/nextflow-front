import type { IProduct } from "./product.interface";
import type { IUser } from "./user.interface";
import type { TMovementType } from "@/types/enums";

export interface IStockMovement {
  id?: string;
  description?: string;
  productId: string;
  product?: IProduct;
  userId: string;
  user?: IUser;
  movementType: TMovementType;
  quantity: number | string;
  quote: number | string;
  createAt?: string;
}
