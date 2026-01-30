import { useNavigate } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { ClientTab } from "@/pages/Client/Tabs/ClientTab";
import { AddressesTab } from "@/pages/Client/Tabs/AddressesTab";
import { ContactsTab } from "@/pages/Client/Tabs/ContactsTab";
import { ClientsProvider } from "@/providers/clients.provider";

function CreateClient() {
  const navigate = useNavigate();

  const handleBack = () => navigate("/clients");

  const tabs = [
    {
      value: "client",
      label: "Cliente",
      content: <ClientTab mode="create" />,
    },
    {
      value: "addresses",
      label: "Endereços",
      content: <AddressesTab clientId={null} disabled />,
    },
    {
      value: "contacts",
      label: "Contatos",
      content: <ContactsTab clientId={null} disabled />,
    },
  ];

  return (
    <EntityTabsLayout
      title="Criar Cliente"
      tabs={tabs}
      defaultTab="client"
      disabledTabs={["addresses", "contacts"]}
      onBack={handleBack}
    />
  );
}

export default function CreateClientPageWrapper() {
  return (
    <ClientsProvider>
      <CreateClient />
    </ClientsProvider>
  );
}
