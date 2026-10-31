import { useCallback, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import type { IOption } from "@/interfaces/api.interface";
import { cityService } from "@/services/city.service";
import { handleError } from "@/utils/toast.helpers";

/** Combo de cidade: busca na API, até 20 itens, e guarda a cidade já escolhida entre as opções. */
export function useCityOptions() {
  const { token } = useAuth();
  const auth = token ?? undefined;
  const [cityOptions, setCityOptions] = useState<IOption[]>([]);

  const searchCities = useCallback(
    async (search: string): Promise<IOption[]> => {
      try {
        const cities: IOption[] = (await cityService.options(search, auth)).map(
          (city) => ({ ...city })
        );
        setCityOptions(cities);
        return cities;
      } catch (error) {
        handleError(error, "Erro ao buscar cidades");
        return [];
      }
    },
    [auth]
  );

  const findCityByIbge = useCallback(
    async (ibgeCode: string) => {
      const city = await cityService.findByIbge(ibgeCode, auth);
      if (city) setCityOptions((current) => [{ ...city }, ...current]);
      return city;
    },
    [auth]
  );

  const keepCityOption = useCallback((option: IOption) => {
    setCityOptions((current) =>
      current.some((o) => o.value === option.value)
        ? current
        : [option, ...current]
    );
  }, []);

  return { cityOptions, searchCities, findCityByIbge, keepCityOption };
}
