import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { IClient } from "@/interfaces/client.interface";
import { clientService } from "@/services/client.service";
import { ClientsContext } from "@/contexts/clients.context";

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<IClient[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const { token } = useAuth();

  const searchClients = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await clientService.getAll(query, token ?? undefined);
      setClients(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const selectClient = useCallback(
    async (id: string): Promise<void> => {
      const data = await clientService.getById(id, token ?? undefined);
      setSelectedClient(data);
    },
    [token]
  );

  const createClient = useCallback(
    async (client: IClient): Promise<IClient> => {
      const data = await clientService.create(client, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateClient = useCallback(
    async (id: string, client: IClient): Promise<IClient> => {
      const data = await clientService.update(id, client, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      await clientService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <ClientsContext.Provider
      value={{
        clients,
        pagination,
        selectedClient,
        searchClients,
        selectClient,
        createClient,
        updateClient,
        deleteClient,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}
