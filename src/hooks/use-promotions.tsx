import { useContext } from "react";
import { PromotionsContext } from "@/contexts/promotions.context";

export function usePromotions() {
  const context = useContext(PromotionsContext);

  if (!context) {
    throw new Error("usePromotions must be used within a PromotionsProvider");
  }

  return context;
}
