import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { ICity } from "@/interfaces/locations.interface";
import { cityService } from "@/services/city.service";
import { CitiesContext } from "@/contexts/cities.context";

export function CitiesProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<ICity[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedCity, setSelectedCity] = useState<ICity | null>(null);
  const { token } = useAuth();

  const searchCities = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await cityService.getAll(query, token ?? undefined);
      setCities(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const selectCity = useCallback(
    async (id: string): Promise<void> => {
      const data = await cityService.getById(id, token ?? undefined);
      setSelectedCity(data);
    },
    [token]
  );

  const createCity = useCallback(
    async (city: ICity): Promise<ICity> => {
      const data = await cityService.create(city, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateCity = useCallback(
    async (id: string, city: ICity): Promise<ICity> => {
      const data = await cityService.update(id, city, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteCity = useCallback(
    async (id: string): Promise<void> => {
      await cityService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <CitiesContext.Provider
      value={{
        cities,
        pagination,
        selectedCity,
        searchCities,
        selectCity,
        createCity,
        updateCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}
