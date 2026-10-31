import { useCallback, useState, type ReactNode } from "react";

import { ContactsContext } from "@/contexts/contacts.context";
import { useAuth } from "@/hooks/use-auth";
import type {
  ContactResponseDto,
  UpdateContactRequestDto,
} from "@/interfaces/contact.interface";
import { contactService } from "@/services/contact.service";
import type { TOwnerType } from "@/types/enums";

/** Contatos de um dono: toda chamada leva `ownerType` e `ownerId` (decisão 4 de 29/10). */
export function ContactsProvider({
  ownerType,
  ownerId,
  children,
}: {
  ownerType: TOwnerType;
  ownerId: string;
  children: ReactNode;
}) {
  const [contacts, setContacts] = useState<ContactResponseDto[]>([]);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const loadContacts = useCallback(async () => {
    const response = await contactService.getAll(
      { filters: { ownerType, ownerId }, page: 1, perPage: 100 },
      auth
    );
    setContacts(response.items);
  }, [auth, ownerId, ownerType]);

  const createContact = useCallback(
    async (dto: UpdateContactRequestDto) => {
      await contactService.create({ ...dto, ownerType, ownerId }, auth);
      await loadContacts();
    },
    [auth, loadContacts, ownerId, ownerType]
  );

  const updateContact = useCallback(
    async (id: string, dto: UpdateContactRequestDto) => {
      await contactService.update(id, dto, auth);
      await loadContacts();
    },
    [auth, loadContacts]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      await contactService.delete(id, auth);
      await loadContacts();
    },
    [auth, loadContacts]
  );

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        loadContacts,
        createContact,
        updateContact,
        deleteContact,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}
