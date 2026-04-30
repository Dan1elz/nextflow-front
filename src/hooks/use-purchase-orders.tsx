import { useContext } from "react";
import { PurchaseOrdersContext } from "@/contexts/purchase-orders.context";

export function usePurchaseOrders() {
  const context = useContext(PurchaseOrdersContext);

  if (!context) {
    throw new Error(
      "usePurchaseOrders must be used within a PurchaseOrdersProvider"
    );
  }

  return context;
}
