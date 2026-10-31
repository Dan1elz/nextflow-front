import { useCallback, useState, type ReactNode } from "react";

import { ClientsContext } from "@/contexts/clients.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  ClientListItemDto,
  ClientOption,
  ClientRequestDto,
  ClientResponseDto,
} from "@/interfaces/client.interface";
import { clientService } from "@/services/client.service";

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientListItemDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedClient, setSelectedClient] =
    useState<ClientResponseDto | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchClients = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await clientService.getAll(query, auth);
      setClients(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const searchClientsForOptions = useCallback(
    async (query?: IIndexParams) => {
      const response = await clientService.getAll(query, auth);
      return { data: response.items || [], totalItems: response.total };
    },
    [auth]
  );

  const getClientOption = useCallback(
    async (id: string): Promise<ClientOption> => {
      const client = await clientService.getById(id, auth);
      return {
        id: client.id,
        fullName: `${client.name} ${client.lastName ?? ""}`.trim(),
      };
    },
    [auth]
  );

  const selectClient = useCallback(
    async (id: string) => {
      setSelectedClient(await clientService.getById(id, auth));
    },
    [auth]
  );

  const createClient = useCallback(
    (dto: ClientRequestDto) => clientService.create(dto, auth),
    [auth]
  );

  const updateClient = useCallback(
    (id: string, dto: ClientRequestDto) => clientService.update(id, dto, auth),
    [auth]
  );

  const deleteClient = useCallback(
    (id: string) => clientService.delete(id, auth),
    [auth]
  );

  const reactivateClient = useCallback(
    (id: string) => clientService.reactivate(id, auth),
    [auth]
  );

  return (
    <ClientsContext.Provider
      value={{
        clients,
        selectedClient,
        pagination,
        searchClients,
        searchClientsForOptions,
        getClientOption,
        selectClient,
        createClient,
        updateClient,
        deleteClient,
        reactivateClient,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}
