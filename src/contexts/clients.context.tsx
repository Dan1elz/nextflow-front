import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  ClientListItemDto,
  ClientOption,
  ClientRequestDto,
  ClientResponseDto,
} from "@/interfaces/client.interface";

export type ClientsContextType = {
  clients: ClientListItemDto[];
  selectedClient: ClientResponseDto | null;
  pagination: IPaginationInfo | null;
  searchClients: (query?: IIndexParams) => Promise<void>;
  searchClientsForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: ClientOption[]; totalItems: number }>;
  getClientOption: (id: string) => Promise<ClientOption>;
  selectClient: (id: string) => Promise<void>;
  createClient: (dto: ClientRequestDto) => Promise<ClientResponseDto>;
  updateClient: (
    id: string,
    dto: ClientRequestDto
  ) => Promise<ClientResponseDto>;
  deleteClient: (id: string) => Promise<void>;
  reactivateClient: (id: string) => Promise<void>;
};

export const ClientsContext = createContext<ClientsContextType | null>(null);
