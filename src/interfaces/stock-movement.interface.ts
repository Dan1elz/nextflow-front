import type { IProduct } from "./product.interface";
import type { UserResponseDto } from "./user.interface";
import type { TLegacyMovementType } from "@/types/enums";

export interface IStockMovement {
  id?: string;
  description?: string;
  productId: string;
  product?: IProduct;
  userId: string;
  user?: UserResponseDto;
  movementType: TLegacyMovementType;
  quantity: number | string;
  quote: number | string;
  createAt?: string;
}
