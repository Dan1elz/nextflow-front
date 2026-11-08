import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentStore } from "@/hooks/use-current-store";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { PurchaseOrderFormDto } from "@/interfaces/purchase-order.interface";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { TPurchaseStatus } from "@/types/enums";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

function EditPurchaseOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { storeId } = useCurrentStore();
  const { getPurchaseOrderForm, updatePurchaseOrder } = usePurchaseOrders();
  const [form, setForm] = useState<PurchaseOrderFormDto | null>(null);

  useEffect(() => {
    if (!id) return;
    getPurchaseOrderForm(id)
      .then((data) => {
        // Recebido e cancelado não mudam (RN-CP03): abre a visualização.
        if (
          data.status !== TPurchaseStatus.Budget &&
          data.status !== TPurchaseStatus.Pending
        )
          navigate(`/purchase-orders/${id}/view`, { replace: true });
        else setForm(data);
      })
      .catch((error) => {
        handleError(error, "Erro ao buscar pedido de compra");
        navigate("/purchase-orders");
      });
  }, [getPurchaseOrderForm, id, navigate]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => navigate(`/purchase-orders/${id}/view`)}
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">
          {form
            ? `Editar pedido de compra nº ${form.number}`
            : "Editar pedido de compra"}
        </h1>
      </div>
      {form && id ? (
        <PurchaseOrderForm
          mode="edit"
          storeId={storeId}
          initialData={form}
          onSubmit={async (dto) => {
            await updatePurchaseOrder(id, dto);
            handleSuccess("Pedido de compra atualizado");
            navigate(`/purchase-orders/${id}/view`);
          }}
        />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}

export default function EditPurchaseOrderPageWrapper() {
  return (
    <PurchaseOrdersProvider>
      <EditPurchaseOrder />
    </PurchaseOrdersProvider>
  );
}
