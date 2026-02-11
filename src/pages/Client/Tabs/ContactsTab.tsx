import { useState, useEffect, useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { ContactForm } from "@/components/forms/contact-form";
import { ContactsProvider } from "@/providers/contacts.provider";
import { useContacts } from "@/hooks/use-contacts";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IContact } from "@/interfaces/contact.interface";
import type { ContactFormData } from "@/schemas/contact.schema";
import { Checkbox } from "@/components/ui/checkbox";

const PER_PAGE_MAX = 9999;

type ContactsTabProps = {
  clientId: string | null;
  disabled?: boolean;
};

function ContactsTabContent({ clientId, disabled = false }: ContactsTabProps) {
  const {
    contacts,
    searchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts();

  const [editingContact, setEditingContact] = useState<IContact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addFormKey, setAddFormKey] = useState(0);
  const [, setSelectedIds] = useState<string[]>([]);

  const fetchContacts = useCallback(() => {
    searchContacts({
      filters: {},
      page: 1,
      perPage: PER_PAGE_MAX,
    }).catch((err) => {
      handleError(err, "Erro ao buscar contatos");
    });
  }, [searchContacts]);

  useEffect(() => {
    if (!clientId) return;
    fetchContacts();
  }, [clientId, fetchContacts]);

  const list = useMemo(() => {
    if (!clientId) return [];
    return contacts.filter(
      (c) => c.clientId === clientId || String(c.clientId) === clientId
    );
  }, [contacts, clientId]);

  const handleSubmit = useCallback(
    async (data: ContactFormData) => {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const payload: IContact = {
          clientId,
          description: data.description,
          fone: data.fone ?? "",
          email: data.email?.trim() || "",
        };
        if (editingContact?.id) {
          await updateContact(editingContact.id, {
            ...payload,
            id: editingContact.id,
          });
          handleSuccess("Contato atualizado com sucesso");
          setEditingContact(null);
        } else {
          await createContact(payload);
          handleSuccess("Contato adicionado com sucesso");
          setAddFormKey((k) => k + 1);
        }
        fetchContacts();
      } catch (err) {
        handleError(err, "Erro ao salvar contato");
      } finally {
        setIsLoading(false);
      }
    },
    [clientId, editingContact, createContact, updateContact, fetchContacts]
  );

  const handleEdit = useCallback((row: IContact) => {
    setEditingContact(row);
  }, []);

  const handleDelete = useCallback(
    async (row: IContact) => {
      if (!row.id) return;
      try {
        await deleteContact(row.id);
        handleSuccess("Contato excluído com sucesso");
        if (editingContact?.id === row.id) setEditingContact(null);
        fetchContacts();
      } catch (err) {
        handleError(err, "Erro ao excluir contato");
      }
    },
    [deleteContact, editingContact, fetchContacts]
  );

  const columns = useMemo<ColumnDef<IContact>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Selecionar linha"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      { accessorKey: "description", header: "Descrição" },
      { accessorKey: "fone", header: "Telefone" },
      { accessorKey: "email", header: "E-mail" },
      ...(disabled
        ? []
        : [
            {
              id: "actions",
              header: "Ações",
              cell: ({ row }) => (
                <NavActionColumn
                  object={row.original}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  disableView
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<IContact>,
          ]),
    ],
    [disabled, handleEdit, handleDelete]
  );

  if (!clientId) {
    return (
      <p className="text-muted-foreground text-sm">
        Salve o cliente antes de gerenciar contatos.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-4">
          {editingContact ? "Editar contato" : "Adicionar contato"}
        </h3>
        <ContactForm
          key={editingContact?.id ?? `new-${addFormKey}`}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialData={editingContact}
          disabled={disabled}
          onCancelEdit={
            editingContact && !disabled
              ? () => setEditingContact(null)
              : undefined
          }
        />
      </div>

      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={list}
          page={1}
          totalPages={1}
          total={list.length}
          onPageChange={() => {}}
          disablePagination
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}

export function ContactsTab(props: ContactsTabProps) {
  return (
    <ContactsProvider>
      <ContactsTabContent {...props} />
    </ContactsProvider>
  );
}
