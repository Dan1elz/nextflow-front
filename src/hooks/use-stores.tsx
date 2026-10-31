import { useContext } from "react";
import { StoresContext } from "@/contexts/stores.context";

export function useStores() {
  const context = useContext(StoresContext);

  if (!context) {
    throw new Error("useStores must be used within a StoresProvider");
  }

  return context;
}
