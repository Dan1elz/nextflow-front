import { useContext } from "react";
import { LegacyProductsContext } from "@/contexts/legacy-products.context";

export function useLegacyProducts() {
  const context = useContext(LegacyProductsContext);

  if (!context) {
    throw new Error(
      "useLegacyProducts must be used within a LegacyProductsProvider"
    );
  }

  return context;
}
