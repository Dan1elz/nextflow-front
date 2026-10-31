import { useContext } from "react";
import { CollectionsContext } from "@/contexts/collections.context";

export function useCollections() {
  const context = useContext(CollectionsContext);

  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }

  return context;
}
