import { useContext } from "react";
import { StockMovementsContext } from "@/contexts/stock-movements.context";

export function useStockMovements() {
  const context = useContext(StockMovementsContext);

  if (!context) {
    throw new Error("useStockMovements must be used within a StockMovementsProvider");
  }

  return context;
}
