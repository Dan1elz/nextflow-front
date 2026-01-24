import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { IClient } from "@/interfaces/client.interface";

export type ClientsContextType = {
  clients: IClient[];
  selectedClient: IClient | null;
  pagination: IPaginationInfo | null;
  searchClients: (query?: IIndexParams) => Promise<void>;
  selectClient: (id: string) => Promise<void>;
  createClient: (client: IClient) => Promise<IClient>;
  updateClient: (id: string, client: IClient) => Promise<IClient>;
  deleteClient: (id: string) => Promise<void>;
};

export const ClientsContext = createContext<ClientsContextType | null>(null);
