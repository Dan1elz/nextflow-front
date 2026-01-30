import { useNavigate, useParams } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { ClientTab } from "@/pages/Client/Tabs/ClientTab";
import { AddressesTab } from "@/pages/Client/Tabs/AddressesTab";
import { ContactsTab } from "@/pages/Client/Tabs/ContactsTab";
import { ClientsProvider } from "@/providers/clients.provider";

function ViewClient() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleBack = () => navigate("/clients");

  const tabs = [
    {
      value: "client",
      label: "Cliente",
      content: <ClientTab mode="view" />,
    },
    {
      value: "addresses",
      label: "Endereços",
      content: <AddressesTab clientId={id ?? null} disabled />,
    },
    {
      value: "contacts",
      label: "Contatos",
      content: <ContactsTab clientId={id ?? null} disabled />,
    },
  ];

  return (
    <EntityTabsLayout
      title="Visualizar Cliente"
      tabs={tabs}
      defaultTab="client"
      onBack={handleBack}
    />
  );
}

export default function ViewClientPageWrapper() {
  return (
    <ClientsProvider>
      <ViewClient />
    </ClientsProvider>
  );
}
