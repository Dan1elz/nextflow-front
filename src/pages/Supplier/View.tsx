import { useNavigate, useParams } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { SupplierTab } from "@/pages/Supplier/Tabs/SupplierTab";
import { AddressesTab } from "@/pages/Supplier/Tabs/AddressesTab";
import { ContactsTab } from "@/pages/Supplier/Tabs/ContactsTab";
import { SuppliersProvider } from "@/providers/suppliers.provider";

function ViewSupplier() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleBack = () => navigate("/suppliers");

  const tabs = [
    {
      value: "supplier",
      label: "Fornecedor",
      // O modo "view" já desabilita as ações de submit no formulário base
      content: <SupplierTab mode="view" />,
    },
    {
      value: "addresses",
      label: "Endereços",
      // Passamos o supplierId para listar e disabled para ocultar ações de edição/exclusão
      content: <AddressesTab supplierId={id ?? null} disabled />,
    },
    {
      value: "contacts",
      label: "Contatos",
      // Passamos o supplierId para listar e disabled para ocultar ações de edição/exclusão
      content: <ContactsTab supplierId={id ?? null} disabled />,
    },
  ];

  return (
    <EntityTabsLayout
      title="Visualizar Fornecedor"
      tabs={tabs}
      defaultTab="supplier"
      onBack={handleBack}
    />
  );
}

export default function ViewSupplierPageWrapper() {
  return (
    <SuppliersProvider>
      <ViewSupplier />
    </SuppliersProvider>
  );
}
