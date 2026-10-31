import { createContext } from "react";

import type {
  ContactResponseDto,
  UpdateContactRequestDto,
} from "@/interfaces/contact.interface";

export type ContactsContextType = {
  contacts: ContactResponseDto[];
  loadContacts: () => Promise<void>;
  createContact: (dto: UpdateContactRequestDto) => Promise<void>;
  updateContact: (id: string, dto: UpdateContactRequestDto) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
};

export const ContactsContext = createContext<ContactsContextType | null>(null);
