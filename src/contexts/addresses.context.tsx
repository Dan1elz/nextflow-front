import { createContext } from "react";

import type {
  IAddress,
  IResolveAddressFromCepPayload,
  IResolveAddressFromCepResult,
} from "@/interfaces/address.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

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
    payload: IResolveAddressFromCepPayload
  ) => Promise<IResolveAddressFromCepResult>;
};

export const AddressesContext = createContext<AddressesContextType | null>(
  null
);
