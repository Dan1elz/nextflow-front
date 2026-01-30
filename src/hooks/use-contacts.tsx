import { useContext } from "react";
import { ContactsContext } from "@/contexts/contacts.context";

export function useContacts() {
  const context = useContext(ContactsContext);

  if (!context) {
    throw new Error("useContacts must be used within a ContactsProvider");
  }

  return context;
}
