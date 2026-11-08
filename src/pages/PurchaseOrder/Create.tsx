import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentStore } from "@/hooks/use-current-store";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { handleSuccess } from "@/utils/toast.helpers";

function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { storeId } = useCurrentStore();
  const { createPurchaseOrder } = usePurchaseOrders();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => navigate("/purchase-orders")}
        >
          <ArrowLeft />
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Novo pedido de compra</h1>
          <p className="text-sm text-muted-foreground">
            Escolha o fornecedor, adicione os itens e salve como orçamento. O
            envio ao fornecedor é um passo seguinte, na visualização.
          </p>
        </div>
      </div>
      {storeId ? (
        // Trocar a loja no topo recomeça o pedido: os itens e o custo sugerido são da loja anterior.
        <PurchaseOrderForm
          key={storeId}
          mode="create"
          storeId={storeId}
          onSubmit={async (dto) => {
            const created = await createPurchaseOrder(dto);
            handleSuccess(`Pedido nº ${created.number} criado em orçamento`);
            navigate(`/purchase-orders/${created.id}/view`);
          }}
        />
      ) : (
        <Alert>
          <AlertTitle>Selecione uma loja</AlertTitle>
          <AlertDescription>
            O pedido de compra nasce na loja escolhida no topo e é recebido no
            local de recebimento padrão dela.
          </AlertDescription>
        </Alert>
      )}
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
