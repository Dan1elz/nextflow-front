import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { IClient } from "@/interfaces/client.interface";

export type ClientsContextType = {
  clients: IClient[];
  selectedClient: IClient | null;
  pagination: IPaginationInfo | null;
  searchClients: (query?: IIndexParams) => Promise<void>;
  searchClientsForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: IClient[]; totalItems: number }>;
  selectClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Promise<IClient>;
  createClient: (client: IClient) => Promise<IClient>;
  updateClient: (id: string, client: IClient) => Promise<IClient>;
  deleteClient: (id: string) => Promise<void>;
  reactivateClient: (id: string) => Promise<void>;
};

export const ClientsContext = createContext<ClientsContextType | null>(null);
