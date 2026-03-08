import { useContext } from "react";
import { OrdersContext } from "@/contexts/orders.context";

export function useOrders() {
  const context = useContext(OrdersContext);

  if (!context) {
    throw new Error("useOrders must be used within a OrdersProvider");
  }

  return context;
}
