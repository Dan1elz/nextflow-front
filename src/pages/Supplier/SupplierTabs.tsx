import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";

import { OwnerAddresses } from "@/components/app/owner-addresses";
import { OwnerContacts } from "@/components/app/owner-contacts";
import { PendingTab } from "@/components/app/pending-tab";
import { SupplierForm } from "@/components/forms/supplier-form";
import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuppliers } from "@/hooks/use-suppliers";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import type { SupplierFormData } from "@/schemas/supplier.schema";
import { TOwnerType } from "@/types/enums";
import { formatOnlyNumbers } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type Mode = "create" | "edit" | "view";

const TITLES: Record<Mode, string> = {
  create: "Criar fornecedor",
  edit: "Editar fornecedor",
  view: "Visualizar fornecedor",
};

function SupplierTabsContent({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedSupplier, selectSupplier, createSupplier, updateSupplier } =
    useSuppliers();

  useEffect(() => {
    if (!id) return;
    selectSupplier(id).catch((error) => {
      handleError(error, "Erro ao buscar fornecedor");
      navigate("/suppliers");
    });
  }, [id, navigate, selectSupplier]);

  const handleSubmit = async (data: SupplierFormData) => {
    const dto = {
      name: data.name,
      cnpj: formatOnlyNumbers(data.cnpj),
      leadTimeDays: Number(data.leadTimeDays),
      note: data.note || null,
    };
    if (id) {
      await updateSupplier(id, dto);
      handleSuccess("Fornecedor atualizado com sucesso");
      navigate("/suppliers");
    } else {
      const created = await createSupplier(dto);
      handleSuccess("Fornecedor criado com sucesso");
      navigate(`/suppliers/${created.id}/edit?step=2`);
    }
  };

  const ready = mode === "create" || !!selectedSupplier;
  const readOnly = mode === "view";

  const tabs = [
    {
      value: "supplier",
      label: "Dados",
      content: ready ? (
        <SupplierForm
          mode={mode}
          initialData={selectedSupplier}
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
          ownerType={TOwnerType.Supplier}
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
          ownerType={TOwnerType.Supplier}
          ownerId={id}
          readOnly={readOnly}
        />
      ),
    },
    {
      value: "products",
      label: "Produtos",
      content: (
        <PendingTab
          icon={Package}
          title="Sem produtos por enquanto"
          description="Os produtos vinculados aparecem aqui quando o catálogo estiver pronto."
        />
      ),
    },
    {
      value: "purchases",
      label: "Compras",
      content: (
        <PendingTab
          icon={ShoppingBag}
          title="Sem compras por enquanto"
          description="Os pedidos de compra aparecem aqui quando o módulo de compras estiver pronto."
        />
      ),
    },
  ];

  return (
    <EntityTabsLayout
      title={TITLES[mode]}
      tabs={tabs}
      defaultTab="supplier"
      disabledTabs={
        id ? [] : ["addresses", "contacts", "products", "purchases"]
      }
      onBack={() => navigate("/suppliers")}
    />
  );
}

export function SupplierTabs({ mode }: { mode: Mode }) {
  return (
    <SuppliersProvider>
      <SupplierTabsContent mode={mode} />
    </SuppliersProvider>
  );
}
