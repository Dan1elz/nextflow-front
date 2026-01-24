import { useContext } from "react";
import { AddressesContext } from "@/contexts/addresses.context";

export function useAddresses() {
  const context = useContext(AddressesContext);

  if (!context) {
    throw new Error("useAddresses must be used within a AddressesProvider");
  }

  return context;
}
