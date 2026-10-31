import { createContext } from "react";

import type {
  AddressResponseDto,
  UpdateAddressRequestDto,
} from "@/interfaces/address.interface";

export type AddressesContextType = {
  addresses: AddressResponseDto[];
  loadAddresses: () => Promise<void>;
  createAddress: (dto: UpdateAddressRequestDto) => Promise<void>;
  updateAddress: (id: string, dto: UpdateAddressRequestDto) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
};

export const AddressesContext = createContext<AddressesContextType | null>(
  null
);
