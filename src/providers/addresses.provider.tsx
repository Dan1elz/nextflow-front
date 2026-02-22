import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type {
  IAddress,
  IResolveAddressFromCepPayload,
  IResolveAddressFromCepResult,
} from "@/interfaces/address.interface";
import { addressService } from "@/services/address.service";
import { AddressesContext } from "@/contexts/addresses.context";

export function AddressesProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const { token } = useAuth();

  const searchAddresses = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await addressService.getAll(query, token ?? undefined);
      setAddresses(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const selectAddress = useCallback(
    async (id: string): Promise<void> => {
      const data = await addressService.getById(id, token ?? undefined);
      setSelectedAddress(data);
    },
    [token]
  );

  const createAddress = useCallback(
    async (address: IAddress): Promise<IAddress> => {
      const data = await addressService.create(address, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateAddress = useCallback(
    async (id: string, address: IAddress): Promise<IAddress> => {
      const data = await addressService.update(id, address, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteAddress = useCallback(
    async (id: string): Promise<void> => {
      await addressService.delete(id, token ?? undefined);
    },
    [token]
  );

  const resolveFromCep = useCallback(
    async (
      payload: IResolveAddressFromCepPayload
    ): Promise<IResolveAddressFromCepResult> => {
      return await addressService.resolveFromCep(payload, token ?? undefined);
    },
    [token]
  );

  return (
    <AddressesContext.Provider
      value={{
        addresses,
        pagination,
        selectedAddress,
        searchAddresses,
        selectAddress,
        createAddress,
        updateAddress,
        deleteAddress,
        resolveFromCep,
      }}
    >
      {children}
    </AddressesContext.Provider>
  );
}
