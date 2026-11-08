import { useContext } from "react";

import { CurrentStoreContext } from "@/contexts/current-store.context";

/**
 * Loja do topo para leituras que só ganham um detalhe com ela (estoque da loja na previsão). Ao contrário de `useCurrentStore`,
 * não exige o provider: fora dele (telas e testes isolados) devolve `null`, a visão de todas as lojas.
 */
export function useSelectedStoreId(): string | null {
  return useContext(CurrentStoreContext)?.storeId ?? null;
}
