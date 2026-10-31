import type { TLegacyOrderStatus, TOrderType } from "@/types/enums";
import type { ClientResponseDto } from "./client.interface";
import type { IProduct } from "./product.interface";
import type { UserResponseDto } from "./user.interface";

export interface IOrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  product?: IProduct;
  quantity: number | string;
  unitPrice?: number | string;
  discount: number | string;
}

export interface IOrder {
  id?: string;
  clientId: string;
  client?: Pick<ClientResponseDto, "id" | "name" | "lastName">;
  userId?: string;
  user?: UserResponseDto;
  status?: TLegacyOrderStatus;
  type: TOrderType;
  lossReason?: string | null;
  totalAmount?: number | string;
  totalDiscount?: number | string;
  orderItems: IOrderItem[];
  createdAt?: string;
  updateAt?: string;
}

export interface IUpdateOrder {
  userId?: string;
  items: IOrderItem[];
}
