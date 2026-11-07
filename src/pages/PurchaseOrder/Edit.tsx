import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container mx-auto flex max-w-7xl flex-col gap-4 p-4 pt-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => navigate(`/purchase-orders/${id}/view`)}
          >
            <ArrowLeft />
          </Button>
          <CardTitle>
            {form
              ? `Editar pedido de compra nº ${form.number}`
              : "Editar pedido de compra"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
