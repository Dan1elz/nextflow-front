import { useNavigate } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { SupplierTab } from "@/pages/Supplier/Tabs/SupplierTab";
import { AddressesTab } from "@/pages/Supplier/Tabs/AddressesTab";
import { ContactsTab } from "@/pages/Supplier/Tabs/ContactsTab";
import { SuppliersProvider } from "@/providers/suppliers.provider";

function CreateSupplier() {
  const navigate = useNavigate();

  const handleBack = () => navigate("/suppliers");

  const tabs = [
    {
      value: "supplier",
      label: "Fornecedor",
      content: <SupplierTab mode="create" />,
    },
    {
      value: "addresses",
      label: "Endereços",
      // supplierId como null pois o registro ainda não existe
      content: <AddressesTab supplierId={null} disabled />,
    },
    {
      value: "contacts",
      label: "Contatos",
      // supplierId como null pois o registro ainda não existe
      content: <ContactsTab supplierId={null} disabled />,
    },
  ];

  return (
    <EntityTabsLayout
      title="Criar Fornecedor"
      tabs={tabs}
      defaultTab="supplier"
      // Mantemos o bloqueio das abas dependentes até que o fornecedor seja criado
      disabledTabs={["addresses", "contacts"]}
      onBack={handleBack}
    />
  );
}

export default function CreateSupplierPageWrapper() {
  return (
    <SuppliersProvider>
      <CreateSupplier />
    </SuppliersProvider>
  );
}
