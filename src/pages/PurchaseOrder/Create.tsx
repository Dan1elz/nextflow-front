import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentStore } from "@/hooks/use-current-store";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { handleSuccess } from "@/utils/toast.helpers";

function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { storeId } = useCurrentStore();
  const { createPurchaseOrder } = usePurchaseOrders();

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-4 p-4 pt-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => navigate("/purchase-orders")}
          >
            <ArrowLeft />
          </Button>
          <CardTitle>Novo pedido de compra</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            mode="create"
            storeId={storeId}
            onSubmit={async (dto) => {
              const created = await createPurchaseOrder(dto);
              handleSuccess(`Pedido nº ${created.number} criado em orçamento`);
              navigate(`/purchase-orders/${created.id}/view`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePurchaseOrderPageWrapper() {
  return (
    <PurchaseOrdersProvider>
      <CreatePurchaseOrder />
    </PurchaseOrdersProvider>
  );
}
