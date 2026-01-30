import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { ICountry } from "@/interfaces/locations.interface";
import { CountriesContext } from "@/contexts/countries.context";
import { countryService } from "@/services/country.service";

export function CountriesProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const { token } = useAuth();

  const searchCountries = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await countryService.getAll(query, token ?? undefined);
      setCountries(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const searchCountriesForOptions = useCallback(
    async (
      query?: IIndexParams
    ): Promise<{ data: ICountry[]; totalItems: number }> => {
      const response = await countryService.getAll(query, token ?? undefined);
      return {
        data: response.data || [],
        totalItems: response.totalItems,
      };
    },
    [token]
  );

  const selectCountry = useCallback(
    async (id: string): Promise<void> => {
      const data = await countryService.getById(id, token ?? undefined);
      setSelectedCountry(data);
    },
    [token]
  );

  const getCountryById = useCallback(
    async (id: string): Promise<ICountry> => {
      return await countryService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createCountry = useCallback(
    async (country: ICountry): Promise<ICountry> => {
      const data = await countryService.create(country, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateCountry = useCallback(
    async (id: string, country: ICountry): Promise<ICountry> => {
      const data = await countryService.update(id, country, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteCountry = useCallback(
    async (id: string): Promise<void> => {
      await countryService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <CountriesContext.Provider
      value={{
        countries,
        pagination,
        selectedCountry,
        searchCountries,
        searchCountriesForOptions,
        selectCountry,
        getCountryById,
        createCountry,
        updateCountry,
        deleteCountry,
      }}
    >
      {children}
    </CountriesContext.Provider>
  );
}
