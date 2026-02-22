import { useNavigate, useParams } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { SupplierTab } from "@/pages/Supplier/Tabs/SupplierTab";
import { AddressesTab } from "@/pages/Supplier/Tabs/AddressesTab";
import { ContactsTab } from "@/pages/Supplier/Tabs/ContactsTab";
import { SuppliersProvider } from "@/providers/suppliers.provider";

function EditSupplier() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleBack = () => navigate("/suppliers");

  const tabs = [
    {
      value: "supplier",
      label: "Fornecedor",
      content: <SupplierTab mode="edit" />,
    },
    {
      value: "addresses",
      label: "Endereços",
      // Passamos o ID do fornecedor para carregar os endereços vinculados
      content: <AddressesTab supplierId={id ?? null} />,
    },
    {
      value: "contacts",
      label: "Contatos",
      // Passamos o ID do fornecedor para carregar os contatos vinculados
      content: <ContactsTab supplierId={id ?? null} />,
    },
  ];

  return (
    <EntityTabsLayout
      title="Editar Fornecedor"
      tabs={tabs}
      defaultTab="supplier"
      onBack={handleBack}
    />
  );
}

export default function EditSupplierPageWrapper() {
  return (
    <SuppliersProvider>
      <EditSupplier />
    </SuppliersProvider>
  );
}
