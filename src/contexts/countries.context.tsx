import { createContext } from "react";

import type {
  ICountry,
  ICreateCountry,
  IUpdateCountry,
} from "@/interfaces/locations.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type CountriesContextType = {
  countries: ICountry[];
  selectedCountry: ICountry | null;
  pagination: IPaginationInfo | null;
  searchCountries: (query?: IIndexParams) => Promise<void>;
  selectCountry: (id: string) => Promise<void>;
  createCountry: (country: ICreateCountry) => Promise<ICountry>;
  updateCountry: (id: string, country: IUpdateCountry) => Promise<ICountry>;
  deleteCountry: (id: string) => Promise<void>;
};

export const CountriesContext = createContext<CountriesContextType | null>(
  null
);
