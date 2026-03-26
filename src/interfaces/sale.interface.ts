import type { TPaymentMethod } from "@/types/enums";
import type { IUser } from "./user.interface";
import type { IOrder } from "./order.interface";

export interface IPayment {
  id?: string;
  amount: number;
  paymentMethod: TPaymentMethod;
}

export interface ISale {
  id?: string;
  userId?: string;
  user?: IUser;
  orderId: string;
  order?: IOrder;
  payments: IPayment[];
}

export interface ICreateSale {
  orderId: string;
  payments: IPayment[];
}
