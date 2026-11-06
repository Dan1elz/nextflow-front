import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  StockAvailabilityDto,
  VariantSaleOptionDto,
} from "@/interfaces/sale-option.interface";
import { saleOptionService } from "@/services/sale-option.service";
import { handleError } from "@/utils/toast.helpers";

interface LoadedOptions {
  key: string;
  term: string;
  items: VariantSaleOptionDto[];
}

/**
 * Opções do seletor de venda (T-VD1) da loja do topo, com a busca debounced. Sem loja selecionada (visão de todas), não
 * busca: a venda sempre nasce numa loja. `term` é a busca a que `options` responde, para o Enter do leitor saber se a
 * lista já é a do código digitado.
 */
export function useVariantSaleOptions(search: string, locationId?: string) {
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const term = useDebounce(search.trim(), 250);
  const key = `${storeId}|${locationId ?? ""}|${term}`;
  const [loaded, setLoaded] = useState<LoadedOptions | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let ignore = false;
    saleOptionService
      .getVariantOptions(
        { search: term, storeId, locationId },
        token ?? undefined
      )
      .then((items) => {
        if (!ignore) setLoaded({ key, term, items });
      })
      .catch((error) => {
        if (ignore) return;
        handleError(error, "Erro ao buscar produtos");
        setLoaded({ key, term, items: [] });
      });
    return () => {
      ignore = true;
    };
  }, [key, storeId, locationId, term, token]);

  const isCurrent = loaded?.key === key;
  return {
    storeId,
    options: loaded?.items ?? [],
    term: loaded?.term ?? "",
    isLoading: !!storeId && (!isCurrent || search.trim() !== term),
  };
}

/** Aviso de falta (T-VD1a): onde a variação tem saldo, fora do local de venda. Só busca com `variantId`. */
export function useStockAvailability(
  variantId: string | null,
  excludeLocationId: string | null
) {
  const { token } = useAuth();
  const key = `${variantId}|${excludeLocationId}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    data: StockAvailabilityDto | null;
  } | null>(null);

  useEffect(() => {
    if (!variantId || !excludeLocationId) return;
    let ignore = false;
    saleOptionService
      .getAvailability(variantId, excludeLocationId, token ?? undefined)
      .then((data) => {
        if (!ignore) setLoaded({ key, data });
      })
      .catch((error) => {
        if (ignore) return;
        handleError(error, "Erro ao consultar o estoque");
        setLoaded({ key, data: null });
      });
    return () => {
      ignore = true;
    };
  }, [key, variantId, excludeLocationId, token]);

  return {
    availability: loaded?.key === key ? loaded.data : null,
    isLoading: !!variantId && loaded?.key !== key,
  };
}
