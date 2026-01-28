import { createContext } from "react";

import type { ICity } from "@/interfaces/locations.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type CitiesContextType = {
  cities: ICity[];
  selectedCity: ICity | null;
  pagination: IPaginationInfo | null;
  searchCities: (query?: IIndexParams) => Promise<void>;
  searchCitiesForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: ICity[]; totalItems: number }>;
  selectCity: (id: string) => Promise<void>;
  getCityById: (id: string) => Promise<ICity>;
  createCity: (city: ICity) => Promise<ICity>;
  updateCity: (id: string, city: ICity) => Promise<ICity>;
  deleteCity: (id: string) => Promise<void>;
};

export const CitiesContext = createContext<CitiesContextType | null>(null);
