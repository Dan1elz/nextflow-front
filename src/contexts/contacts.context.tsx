import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { IContact } from "@/interfaces/contact.interface";

export type ContactsContextType = {
  contacts: IContact[];
  selectedContact: IContact | null;
  pagination: IPaginationInfo | null;
  searchContacts: (query?: IIndexParams) => Promise<void>;
  selectContact: (id: string) => Promise<void>;
  createContact: (contact: IContact) => Promise<IContact>;
  updateContact: (id: string, contact: IContact) => Promise<IContact>;
  deleteContact: (id: string) => Promise<void>;
};

export const ContactsContext = createContext<ContactsContextType | null>(null);
