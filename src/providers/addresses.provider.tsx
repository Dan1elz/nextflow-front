import { useCallback, useState, type ReactNode } from "react";

import { AddressesContext } from "@/contexts/addresses.context";
import { useAuth } from "@/hooks/use-auth";
import type {
  AddressResponseDto,
  UpdateAddressRequestDto,
} from "@/interfaces/address.interface";
import { addressService } from "@/services/address.service";
import type { TOwnerType } from "@/types/enums";

/** Endereços de um dono: toda chamada leva `ownerType` e `ownerId` (decisão 4 de 29/10). */
export function AddressesProvider({
  ownerType,
  ownerId,
  children,
}: {
  ownerType: TOwnerType;
  ownerId: string;
  children: ReactNode;
}) {
  const [addresses, setAddresses] = useState<AddressResponseDto[]>([]);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const loadAddresses = useCallback(async () => {
    const response = await addressService.getAll(
      { filters: { ownerType, ownerId }, page: 1, perPage: 100 },
      auth
    );
    setAddresses(response.items);
  }, [auth, ownerId, ownerType]);

  const createAddress = useCallback(
    async (dto: UpdateAddressRequestDto) => {
      await addressService.create({ ...dto, ownerType, ownerId }, auth);
      await loadAddresses();
    },
    [auth, loadAddresses, ownerId, ownerType]
  );

  const updateAddress = useCallback(
    async (id: string, dto: UpdateAddressRequestDto) => {
      await addressService.update(id, dto, auth);
      await loadAddresses();
    },
    [auth, loadAddresses]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      await addressService.delete(id, auth);
      await loadAddresses();
    },
    [auth, loadAddresses]
  );

  return (
    <AddressesContext.Provider
      value={{
        addresses,
        loadAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
      }}
    >
      {children}
    </AddressesContext.Provider>
  );
}
