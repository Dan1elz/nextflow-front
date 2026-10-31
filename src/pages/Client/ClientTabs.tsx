import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { OwnerAddresses } from "@/components/app/owner-addresses";
import { OwnerContacts } from "@/components/app/owner-contacts";
import { PendingTab } from "@/components/app/pending-tab";
import { ClientForm } from "@/components/forms/client-form";
import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-clients";
import { ClientsProvider } from "@/providers/clients.provider";
import type { ClientFormData } from "@/schemas/client.schema";
import { TOwnerType } from "@/types/enums";
import { formatOnlyNumbers } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type Mode = "create" | "edit" | "view";

const TITLES: Record<Mode, string> = {
  create: "Criar cliente",
  edit: "Editar cliente",
  view: "Visualizar cliente",
};

function ClientTabsContent({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedClient, selectClient, createClient, updateClient } =
    useClients();

  useEffect(() => {
    if (!id) return;
    selectClient(id).catch((error) => {
      handleError(error, "Erro ao buscar cliente");
      navigate("/clients");
    });
  }, [id, navigate, selectClient]);

  const handleSubmit = async (data: ClientFormData) => {
    const dto = {
      name: data.name,
      lastName: data.lastName || null,
      cpf: data.cpf ? formatOnlyNumbers(data.cpf) : null,
      birthDate: data.birthDate || null,
    };
    if (id) {
      await updateClient(id, dto);
      handleSuccess("Cliente atualizado com sucesso");
      navigate("/clients");
    } else {
      const created = await createClient(dto);
      handleSuccess("Cliente criado com sucesso");
      navigate(`/clients/${created.id}/edit?step=2`);
    }
  };

  const ready = mode === "create" || !!selectedClient;
  const readOnly = mode === "view";

  const tabs = [
    {
      value: "client",
      label: "Dados",
      content: ready ? (
        <ClientForm
          mode={mode}
          initialData={selectedClient}
          onSubmit={handleSubmit}
        />
      ) : (
        <Skeleton className="h-48 w-full" />
      ),
    },
    {
      value: "addresses",
      label: "Endereços",
      content: id && (
        <OwnerAddresses
          ownerType={TOwnerType.Client}
          ownerId={id}
          readOnly={readOnly}
        />
      ),
    },
    {
      value: "contacts",
      label: "Contatos",
      content: id && (
        <OwnerContacts
          ownerType={TOwnerType.Client}
          ownerId={id}
          readOnly={readOnly}
        />
      ),
    },
    {
      value: "orders",
      label: "Compras",
      content: (
        <PendingTab
          icon={ShoppingCart}
          title="Sem compras por enquanto"
          description="Os pedidos do cliente aparecem aqui quando o módulo de vendas estiver pronto."
        />
      ),
    },
  ];

  return (
    <EntityTabsLayout
      title={TITLES[mode]}
      tabs={tabs}
      defaultTab="client"
      disabledTabs={id ? [] : ["addresses", "contacts", "orders"]}
      onBack={() => navigate("/clients")}
    />
  );
}

export function ClientTabs({ mode }: { mode: Mode }) {
  return (
    <ClientsProvider>
      <ClientTabsContent mode={mode} />
    </ClientsProvider>
  );
}
