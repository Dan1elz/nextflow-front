import { createContext } from "react";

import type {
  LocationRequestDto,
  StoreRequestDto,
  StoreResponseDto,
  UpdateLocationRequestDto,
  UpdateStoreRequestDto,
} from "@/interfaces/store.interface";

export type StoresContextType = {
  stores: StoreResponseDto[];
  loading: boolean;
  loadStores: () => Promise<void>;
  createStore: (dto: StoreRequestDto) => Promise<void>;
  updateStore: (id: string, dto: UpdateStoreRequestDto) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  reactivateStore: (id: string) => Promise<void>;
  createLocation: (dto: LocationRequestDto) => Promise<void>;
  updateLocation: (id: string, dto: UpdateLocationRequestDto) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  reactivateLocation: (id: string) => Promise<void>;
};

export const StoresContext = createContext<StoresContextType | null>(null);
