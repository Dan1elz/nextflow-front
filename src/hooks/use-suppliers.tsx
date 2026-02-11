import { useContext } from "react";
import { SuppliersContext } from "@/contexts/suppliers.context";

export function useSuppliers() {
  const context = useContext(SuppliersContext);

  if (!context) {
    throw new Error("useSuppliers must be used within a SuppliersProvider");
  }

  return context;
}
