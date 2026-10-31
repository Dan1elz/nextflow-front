import { createContext } from "react";

import type { CurrentUserStoreDto } from "@/interfaces/user.interface";

export type CurrentStoreContextType = {
  stores: CurrentUserStoreDto[];
  /** Loja selecionada no topo; `null` quando a visão é de todas as lojas. */
  storeId: string | null;
  setStoreId: (storeId: string | null) => void;
  /** Empresa com 1 loja e 1 local não vê seletor (RN-CE12, ADR 0009). */
  showSelector: boolean;
};

export const CurrentStoreContext =
  createContext<CurrentStoreContextType | null>(null);
