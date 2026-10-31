import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { ContactForm } from "@/components/forms/contact-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useContacts } from "@/hooks/use-contacts";
import type { ContactResponseDto } from "@/interfaces/contact.interface";
import { ContactsProvider } from "@/providers/contacts.provider";
import type { ContactFormData } from "@/schemas/contact.schema";
import {
  CONTACT_TYPE_LABELS,
  TContactType,
  type TOwnerType,
} from "@/types/enums";
import { formatPhone } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type OwnerContactsProps = {
  ownerType: TOwnerType;
  ownerId: string;
  readOnly?: boolean;
};

function OwnerContactsContent({ readOnly = false }: { readOnly?: boolean }) {
  const {
    contacts,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts();
  const [editing, setEditing] = useState<ContactResponseDto | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadContacts().catch((error) =>
      handleError(error, "Erro ao buscar contatos")
    );
  }, [loadContacts]);

  const handleSubmit = async (data: ContactFormData) => {
    if (editing) {
      await updateContact(editing.id, data);
      handleSuccess("Contato atualizado com sucesso");
      setEditing(null);
    } else {
      await createContact(data);
      handleSuccess("Contato adicionado com sucesso");
    }
    setFormKey((key) => key + 1);
  };

  const handleDelete = useCallback(
    async (row: ContactResponseDto) => {
      try {
        await deleteContact(row.id);
        handleSuccess("Contato excluído com sucesso");
        setEditing((current) => (current?.id === row.id ? null : current));
      } catch (error) {
        handleError(error, "Erro ao excluir contato");
      }
    },
    [deleteContact]
  );

  const columns = useMemo<ColumnDef<ContactResponseDto>[]>(
    () => [
      {
        accessorKey: "value",
        header: "Contato",
        cell: ({ row }) =>
          row.original.type === TContactType.Email
            ? row.original.value
            : formatPhone(row.original.value),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => CONTACT_TYPE_LABELS[row.original.type],
      },
      {
        accessorKey: "isMain",
        header: "Principal",
        cell: ({ row }) =>
          row.original.isMain ? <Badge>Principal</Badge> : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) =>
          readOnly ? null : (
            <NavActionColumn
              object={row.original}
              onEdit={setEditing}
              onDelete={handleDelete}
              disableView
            />
          ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, readOnly]
  );

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && (
        <>
          <ContactForm
            key={editing?.id ?? `new-${formKey}`}
            initialData={editing}
            onSubmit={handleSubmit}
            onCancelEdit={editing ? () => setEditing(null) : undefined}
          />
          <Separator />
        </>
      )}
      <DataTable
        columns={columns}
        data={contacts}
        page={1}
        totalPages={1}
        total={contacts.length}
        onPageChange={() => {}}
        disablePagination
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}

export function OwnerContacts({
  ownerType,
  ownerId,
  readOnly,
}: OwnerContactsProps) {
  return (
    <ContactsProvider ownerType={ownerType} ownerId={ownerId}>
      <OwnerContactsContent readOnly={readOnly} />
    </ContactsProvider>
  );
}
