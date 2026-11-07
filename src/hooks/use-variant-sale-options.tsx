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

/** Respostas recentes por loja, local e termo: reabrir a busca ou repetir um termo não volta à API por 30 s. */
const CACHE_TTL_MS = 30_000;
const optionsCache = new Map<
  string,
  { at: number; items: VariantSaleOptionDto[] }
>();

const readCache = (key: string) => {
  const hit = optionsCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    optionsCache.delete(key);
    return null;
  }
  return hit.items;
};

/**
 * Opções do seletor de venda (T-VD1) da loja do topo, com a busca debounced. Sem loja selecionada (visão de todas), não
 * busca: a venda sempre nasce numa loja. Só busca com `enabled` (lista aberta), usa o cache curto e cancela a busca
 * anterior quando o termo muda. `term` é a busca a que `options` responde, para o Enter do leitor saber se a lista já é
 * a do código digitado.
 */
export function useVariantSaleOptions(
  search: string,
  locationId?: string,
  enabled = true
) {
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const term = useDebounce(search.trim(), 250);
  const key = `${storeId}|${locationId ?? ""}|${term}`;
  const [loaded, setLoaded] = useState<LoadedOptions | null>(null);

  useEffect(() => {
    if (!storeId || !enabled) return;
    const hit = readCache(key);
    if (hit) {
      // Fixa a resposta do cache no estado (fora do render): ela continua valendo depois de o cache expirar.
      let ignore = false;
      queueMicrotask(() => !ignore && setLoaded({ key, term, items: hit }));
      return () => {
        ignore = true;
      };
    }
    const controller = new AbortController();
    saleOptionService
      .getVariantOptions(
        { search: term, storeId, locationId },
        token ?? undefined,
        controller.signal
      )
      .then((items) => {
        optionsCache.set(key, { at: Date.now(), items });
        if (!controller.signal.aborted) setLoaded({ key, term, items });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        handleError(error, "Erro ao buscar produtos");
        setLoaded({ key, term, items: [] });
      });
    return () => controller.abort();
  }, [key, storeId, locationId, term, token, enabled]);

  // Termo já buscado há pouco: responde do cache, sem esperar o efeito.
  const cached = loaded?.key === key ? null : readCache(key);
  const isCurrent = loaded?.key === key || !!cached;
  return {
    storeId,
    options: cached ?? loaded?.items ?? [],
    term: cached ? term : (loaded?.term ?? ""),
    isLoading: !!storeId && enabled && (!isCurrent || search.trim() !== term),
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
