import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SupplierForm } from "@/components/forms/supplier-form";
import { useSuppliers } from "@/hooks/use-suppliers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type {
  CreateSupplierFormData,
  UpdateSupplierFormData,
} from "@/schemas/supplier.schema";
import type { ISupplier } from "@/interfaces/supplier.interface";
import { formatOnlyNumbers } from "@/utils/format.helpers";

type SupplierTabProps = {
  mode: "create" | "edit" | "view";
};

export function SupplierTab({ mode }: SupplierTabProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedSupplier, selectSupplier, createSupplier, updateSupplier } =
    useSuppliers();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "create") return;
    if (!id) {
      navigate("/suppliers");
      return;
    }
    selectSupplier(id).catch((error) => {
      handleError(error, "Erro desconhecido ao buscar fornecedor");
      navigate("/suppliers");
    });
  }, [mode, id, navigate, selectSupplier]);

  const handleSubmit = async (
    data: CreateSupplierFormData | UpdateSupplierFormData
  ) => {
    if (mode === "view") return;

    // Garante que o CNPJ seja enviado apenas com números para o backend .NET
    const cnpj = formatOnlyNumbers(data.cnpj);

    const base = {
      name: data.name,
      cnpj: cnpj,
    };

    try {
      setIsLoading(true);
      if (mode === "create") {
        const created = await createSupplier({
          ...base,
          isActive: true,
        } as ISupplier);

        handleSuccess("Fornecedor criado com sucesso");
        // Redireciona para a edição para permitir acesso a outras possíveis abas (contatos, endereços)
        navigate(`/suppliers/${created.id}/edit`);
      } else if (mode === "edit" && id) {
        await updateSupplier(id, base as ISupplier);
        handleSuccess("Fornecedor atualizado com sucesso");
        navigate("/suppliers");
      }
    } catch (error) {
      handleError(
        error,
        mode === "create"
          ? "Erro ao criar fornecedor"
          : "Erro ao atualizar fornecedor"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (mode !== "create" && !selectedSupplier) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground italic">
        Carregando dados do fornecedor...
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 bg-card">
      <SupplierForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialData={
          mode === "create" ? undefined : (selectedSupplier ?? undefined)
        }
        isEdit={mode !== "create"}
        disabled={mode === "view"}
      />
    </div>
  );
}
