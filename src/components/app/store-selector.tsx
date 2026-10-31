import { Store } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentStore } from "@/hooks/use-current-store";

const ALL_STORES = "all";

/** Seletor de loja do topo. Fica escondido na empresa com 1 loja e 1 local (RN-CE12). */
export function StoreSelector() {
  const { stores, storeId, setStoreId, showSelector } = useCurrentStore();

  if (!showSelector) return null;

  return (
    <Select
      value={storeId ?? ALL_STORES}
      onValueChange={(value) => setStoreId(value === ALL_STORES ? null : value)}
    >
      <SelectTrigger className="w-40 md:w-56" aria-label="Loja selecionada">
        <Store className="size-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {stores.length > 1 && (
            <SelectItem value={ALL_STORES}>Todas as lojas</SelectItem>
          )}
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
