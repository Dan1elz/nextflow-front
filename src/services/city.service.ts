import { BaseService } from "./base.service";
import type { Option } from "@/interfaces/api.interface";

const baseService = new BaseService<Option>("cities");

/** Cidades são só leitura: o front só consulta o combo (decisão 5 de 29/10). */
export const cityService = {
  options: (search: string | undefined, token?: string) =>
    baseService.options(search, token),

  /** Localiza a cidade pelo código IBGE que o ViaCEP devolve. */
  findByIbge: async (ibgeCode: string, token?: string) => {
    const [city] = await baseService.options(undefined, token, {
      filters: JSON.stringify({ ibgeCode }),
    });
    return city as Option | undefined;
  },
};
