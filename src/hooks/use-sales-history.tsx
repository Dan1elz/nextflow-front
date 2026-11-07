import { useContext } from "react";
import { SalesHistoryContext } from "@/contexts/sales-history.context";

export function useSalesHistory() {
  const context = useContext(SalesHistoryContext);

  if (!context) {
    throw new Error(
      "useSalesHistory must be used within a SalesHistoryProvider"
    );
  }

  return context;
}
