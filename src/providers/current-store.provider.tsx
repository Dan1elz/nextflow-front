import { useCallback, useMemo, useState, type ReactNode } from "react";

import { CurrentStoreContext } from "@/contexts/current-store.context";
import { useAuth } from "@/hooks/use-auth";

const STORE_STORAGE_KEY = "current-store-id";
/** Valor guardado para a visão de todas as lojas: nada guardado significa "ainda não escolheu". */
const ALL_STORES = "all";

/** Loja selecionada no topo: a última usada fica no navegador, não na API (decisão 1 de 29/10). */
export function CurrentStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const stores = useMemo(() => user?.stores ?? [], [user?.stores]);
  const [stored, setStored] = useState(() =>
    localStorage.getItem(STORE_STORAGE_KEY)
  );

  // A loja guardada pode ter sido inativada: nesse caso volta para a primeira.
  const storeId = useMemo(() => {
    if (stored === ALL_STORES && stores.length > 1) return null;
    if (stores.some((store) => store.id === stored)) return stored;
    return stores[0]?.id ?? null;
  }, [stored, stores]);

  const setStoreId = useCallback((id: string | null) => {
    const value = id ?? ALL_STORES;
    localStorage.setItem(STORE_STORAGE_KEY, value);
    setStored(value);
  }, []);

  const showSelector = stores.length > 1 || (stores[0]?.locationCount ?? 0) > 1;

  return (
    <CurrentStoreContext.Provider
      value={{ stores, storeId, setStoreId, showSelector }}
    >
      {children}
    </CurrentStoreContext.Provider>
  );
}
