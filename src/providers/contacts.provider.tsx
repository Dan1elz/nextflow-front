import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { IContact } from "@/interfaces/contact.interface";
import { contactService } from "@/services/contact.service";
import { ContactsContext } from "@/contexts/contacts.context";

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null);
  const { token } = useAuth();

  const searchContacts = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await contactService.getAll(query, token ?? undefined);
      setContacts(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const selectContact = useCallback(
    async (id: string): Promise<void> => {
      const data = await contactService.getById(id, token ?? undefined);
      setSelectedContact(data);
    },
    [token]
  );

  const createContact = useCallback(
    async (contact: IContact): Promise<IContact> => {
      const data = await contactService.create(contact, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateContact = useCallback(
    async (id: string, contact: IContact): Promise<IContact> => {
      const data = await contactService.update(id, contact, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteContact = useCallback(
    async (id: string): Promise<void> => {
      await contactService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        pagination,
        selectedContact,
        searchContacts,
        selectContact,
        createContact,
        updateContact,
        deleteContact,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}
