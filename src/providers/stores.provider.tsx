import { useCallback, useState, type ReactNode } from "react";

import { StoresContext } from "@/contexts/stores.context";
import { useAuth } from "@/hooks/use-auth";
import type {
  LocationRequestDto,
  StoreRequestDto,
  StoreResponseDto,
  UpdateLocationRequestDto,
  UpdateStoreRequestDto,
} from "@/interfaces/store.interface";
import { locationService } from "@/services/location.service";
import { storeService } from "@/services/store.service";

/** Toda alteração recarrega a lista e o usuário logado, que traz as lojas do seletor do topo. */
export function StoresProvider({ children }: { children: ReactNode }) {
  const { token, refreshUser } = useAuth();
  const auth = token ?? undefined;
  const [stores, setStores] = useState<StoreResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStores = useCallback(async () => {
    try {
      const response = await storeService.getAll(
        { page: 1, perPage: 100 },
        auth
      );
      setStores(response.items);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const afterChange = useCallback(async () => {
    await Promise.all([loadStores(), refreshUser()]);
  }, [loadStores, refreshUser]);

  const createStore = useCallback(
    async (dto: StoreRequestDto) => {
      await storeService.create(dto, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const updateStore = useCallback(
    async (id: string, dto: UpdateStoreRequestDto) => {
      await storeService.update(id, dto, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const deleteStore = useCallback(
    async (id: string) => {
      await storeService.delete(id, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const reactivateStore = useCallback(
    async (id: string) => {
      await storeService.reactivate(id, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const createLocation = useCallback(
    async (dto: LocationRequestDto) => {
      await locationService.create(dto, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const updateLocation = useCallback(
    async (id: string, dto: UpdateLocationRequestDto) => {
      await locationService.update(id, dto, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const deleteLocation = useCallback(
    async (id: string) => {
      await locationService.delete(id, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  const reactivateLocation = useCallback(
    async (id: string) => {
      await locationService.reactivate(id, auth);
      await afterChange();
    },
    [afterChange, auth]
  );

  return (
    <StoresContext.Provider
      value={{
        stores,
        loading,
        loadStores,
        createStore,
        updateStore,
        deleteStore,
        reactivateStore,
        createLocation,
        updateLocation,
        deleteLocation,
        reactivateLocation,
      }}
    >
      {children}
    </StoresContext.Provider>
  );
}
