import type { IClient } from "./client.interface";
import type { ICity } from "./locations.interface";
import type { IState } from "./locations.interface";
import type { ISupplier } from "./supplier.interface";

export interface IAddress {
  id?: string;
  clientId?: string;
  client?: IClient;
  supplierId?: string;
  supplier?: ISupplier;
  description: string;
  street: string;
  number: string;
  district: string;
  cityId: string;
  city?: ICity;
  stateId: string;
  state?: IState;
  complement: string;
  zipCode: string;
}
