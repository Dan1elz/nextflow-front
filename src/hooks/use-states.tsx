import { useContext } from "react";
import { StatesContext } from "@/contexts/states.context";

export function useStates() {
  const context = useContext(StatesContext);

  if (!context) {
    throw new Error("useStates must be used within a StatesProvider");
  }

  return context;
}
