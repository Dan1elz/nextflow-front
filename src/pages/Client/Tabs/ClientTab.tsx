import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ClientForm } from "@/components/forms/client-form";
import { useClients } from "@/hooks/use-clients";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type {
  CreateClientFormData,
  UpdateClientFormData,
} from "@/schemas/client.schema";
import type { IClient } from "@/interfaces/client.interface";
import { formatOnlyNumbers } from "@/utils/format.helpers";

type ClientTabProps = {
  mode: "create" | "edit" | "view";
};

export function ClientTab({ mode }: ClientTabProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedClient, selectClient, createClient, updateClient } =
    useClients();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "create") return;
    if (!id) {
      navigate("/clients");
      return;
    }
    selectClient(id).catch((error) => {
      handleError(error, "Erro desconhecido ao buscar cliente");
      navigate("/clients");
    });
  }, [mode, id, navigate, selectClient]);

  const handleSubmit = async (
    data: CreateClientFormData | UpdateClientFormData
  ) => {
    if (mode === "view") return;

    const cpf = data.cpf?.trim() ? formatOnlyNumbers(data.cpf) : null;
    const base = {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      cpf,
    };

    try {
      setIsLoading(true);
      if (mode === "create") {
        const created = await createClient({
          ...base,
          isActive: true,
        } as IClient);
        handleSuccess("Cliente criado com sucesso");
        navigate(`/clients/${created.id}/edit`);
      } else if (mode === "edit" && id) {
        await updateClient(id, base as IClient);
        handleSuccess("Cliente atualizado com sucesso");
        navigate("/clients");
      }
    } catch (error) {
      handleError(
        error,
        mode === "create"
          ? "Erro ao criar cliente"
          : "Erro ao atualizar cliente"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (mode !== "create" && !selectedClient) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <ClientForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialData={
          mode === "create" ? undefined : (selectedClient ?? undefined)
        }
        isEdit={mode !== "create"}
        disabled={mode === "view"}
      />
    </div>
  );
}
