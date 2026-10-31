import { useContext } from "react";
import { CurrentStoreContext } from "@/contexts/current-store.context";

export function useCurrentStore() {
  const context = useContext(CurrentStoreContext);

  if (!context) {
    throw new Error(
      "useCurrentStore must be used within a CurrentStoreProvider"
    );
  }

  return context;
}
