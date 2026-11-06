import { useContext } from "react";
import { StockPoliciesContext } from "@/contexts/stock-policies.context";

export function useStockPolicies() {
  const context = useContext(StockPoliciesContext);

  if (!context) {
    throw new Error(
      "useStockPolicies must be used within a StockPoliciesProvider"
    );
  }

  return context;
}
