import type { IClient } from "./client.interface";

export interface IContact {
  id: string;
  clientId?: string;
  client?: IClient;
  supplierId?: string;
  //   supplier?: ISupplier;
  description: string;
  fone: string;
  email: string;
}
