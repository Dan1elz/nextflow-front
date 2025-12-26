import { useContext } from "react";
import { UsersContext } from "@/contexts/users.context";

export function useUsers() {
  const context = useContext(UsersContext);

  if (!context) {
    throw new Error("useUsers must be used within a UsersProvider");
  }

  return context;
}
