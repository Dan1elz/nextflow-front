import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { IState } from "@/interfaces/locations.interface";
import { stateService } from "@/services/state.service";
import { StatesContext } from "@/contexts/states.context";

export function StatesProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<IState[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedState, setSelectedState] = useState<IState | null>(null);
  const { token } = useAuth();

  const searchStates = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await stateService.getAll(query, token ?? undefined);
      setStates(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const selectState = useCallback(
    async (id: string): Promise<void> => {
      const data = await stateService.getById(id, token ?? undefined);
      setSelectedState(data);
    },
    [token]
  );

  const createState = useCallback(
    async (state: IState): Promise<IState> => {
      const data = await stateService.create(state, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateState = useCallback(
    async (id: string, state: IState): Promise<IState> => {
      const data = await stateService.update(id, state, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteState = useCallback(
    async (id: string): Promise<void> => {
      await stateService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <StatesContext.Provider
      value={{
        states,
        pagination,
        selectedState,
        searchStates,
        selectState,
        createState,
        updateState,
        deleteState,
      }}
    >
      {children}
    </StatesContext.Provider>
  );
}
