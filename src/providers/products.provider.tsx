import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { ICountry } from "@/interfaces/locations.interface";
import { ProductsContext } from "@/contexts/countries.context";
import { countryService } from "@/services/country.service";

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ICountry[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ICountry | null>(null);
  const { token } = useAuth();

  const searchProducts = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await countryService.getAll(query, token ?? undefined);
      setProducts(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
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
        selectCountry,
        createCountry,
        updateCountry,
        deleteCountry,
      }}
    >
      {children}
    </CountriesContext.Provider>
  );
}
