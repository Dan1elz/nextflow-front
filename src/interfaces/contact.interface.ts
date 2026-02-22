import type { IClient } from "./client.interface";
import type { ISupplier } from "./supplier.interface";

export interface IContact {
  id?: string;
  clientId?: string;
  client?: IClient;
  supplierId?: string;
  supplier?: ISupplier;
  description: string;
  fone: string;
  email: string;
}
