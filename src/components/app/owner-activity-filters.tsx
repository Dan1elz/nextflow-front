import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { SearchSelect } from "@/components/app/search-select";
import { useAuth } from "@/hooks/use-auth";
import { useCityOptions } from "@/hooks/use-city-options";
import type { IOption } from "@/interfaces/api.interface";
import { BaseService } from "@/services/base.service";

/** Chaves que a API de clientes e fornecedores entende para lugar e compras. */
export type OwnerActivityFilterValues = {
  stateId: string;
  cityId: string;
  purchases: string;
};

/** Valores de `purchases` (ver RegistryListFilters.Purchases na API). */
const purchaseOptions: IOption[] = [
  { value: "with", label: "Com compras" },
  { value: "without", label: "Sem compras" },
  { value: "last30", label: "Comprou nos últimos 30 dias" },
  { value: "last90", label: "Comprou nos últimos 90 dias" },
  { value: "inactive90", label: "Sem comprar há mais de 90 dias" },
];

const stateService = new BaseService<IOption>("states");

/**
 * Filtros de UF, cidade e atividade de compra, iguais nas listagens de clientes e fornecedores. Trocar a UF limpa a
 * cidade (os dois juntos viram interseção na API).
 */
export function OwnerActivityFilters<T extends OwnerActivityFilterValues>({
  filters,
  setFilters,
  purchasesLabel,
}: {
  filters: T;
  setFilters: Dispatch<SetStateAction<T>>;
  purchasesLabel: string;
}) {
  const { token } = useAuth();
  const { cityOptions, searchCities } = useCityOptions();
  const [stateOptions, setStateOptions] = useState<IOption[]>([]);

  useEffect(() => {
    stateService
      .options(undefined, token ?? undefined)
      .then((states) => setStateOptions(states.map((state) => ({ ...state }))))
      .catch(() => setStateOptions([]));
  }, [token]);

  const set = (key: keyof OwnerActivityFilterValues, value: unknown) =>
    setFilters((prev) => ({ ...prev, [key]: value ? String(value) : "" }));

  return (
    <>
      <SearchSelect<IOption>
        field={{
          value: filters.stateId,
          onChange: (value) =>
            setFilters((prev) => ({
              ...prev,
              stateId: value ? String(value) : "",
              cityId: "",
            })),
        }}
        label="UF"
        data={stateOptions}
        placeholder="Todas"
      />
      <SearchSelect<IOption>
        field={{
          value: filters.cityId,
          onChange: (value) => set("cityId", value),
        }}
        label="Cidade/UF"
        data={cityOptions}
        onSearch={searchCities}
        placeholder="Digite para buscar"
      />
      <SearchSelect<IOption>
        field={{
          value: filters.purchases,
          onChange: (value) => set("purchases", value),
        }}
        label={purchasesLabel}
        data={purchaseOptions}
        placeholder="Todos"
      />
    </>
  );
}
