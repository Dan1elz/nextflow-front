import type { TLegacyPaymentMethod } from "@/types/enums";
import type { UserResponseDto } from "./user.interface";
import type { IOrder } from "./order.interface";

export interface IPayment {
  id?: string;
  amount: number;
  paymentMethod: TLegacyPaymentMethod;
}

export interface ISale {
  id?: string;
  userId?: string;
  user?: UserResponseDto;
  orderId: string;
  order?: IOrder;
  payments: IPayment[];
}

export interface ICreateSale {
  orderId: string;
  payments: IPayment[];
}
