import { createContext } from "react";

import type { IAddress } from "@/interfaces/address.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  ResolveAddressFromCepPayload,
  ResolveAddressFromCepResult,
} from "@/services/address.service";

export type AddressesContextType = {
  addresses: IAddress[];
  selectedAddress: IAddress | null;
  pagination: IPaginationInfo | null;
  searchAddresses: (query?: IIndexParams) => Promise<void>;
  selectAddress: (id: string) => Promise<void>;
  createAddress: (address: IAddress) => Promise<IAddress>;
  updateAddress: (id: string, address: IAddress) => Promise<IAddress>;
  deleteAddress: (id: string) => Promise<void>;
  resolveFromCep: (
    payload: ResolveAddressFromCepPayload
  ) => Promise<ResolveAddressFromCepResult>;
};

export const AddressesContext = createContext<AddressesContextType | null>(
  null
);
