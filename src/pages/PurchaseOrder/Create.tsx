import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

import {
  PurchaseOrderForm,
  type PurchaseOrderPrefill,
} from "@/components/forms/purchase-order-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentStore } from "@/hooks/use-current-store";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { PurchaseSuggestionState } from "@/interfaces/purchase-order.interface";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { handleSuccess } from "@/utils/toast.helpers";

function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { storeId } = useCurrentStore();
  const { createPurchaseOrder } = usePurchaseOrders();
  const [params] = useSearchParams();
  const suggestion = (useLocation().state as PurchaseSuggestionState | null)
    ?.suggestion;
  // Aberto pelo estoque baixo do painel: `?productId&variantId&quantity` (quanto falta para o mínimo).
  const productId = params.get("productId");
  const variantId = params.get("variantId");
  const quantity = Number(params.get("quantity"));
  const prefill = useMemo<PurchaseOrderPrefill | null>(
    () =>
      productId && variantId
        ? {
            productId,
            variantId,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
            supplier:
              suggestion?.supplierId && suggestion.supplierName
                ? { id: suggestion.supplierId, name: suggestion.supplierName }
                : null,
          }
        : null,
    [productId, variantId, quantity, suggestion]
  );

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
      {suggestion && (
        <Alert>
          <Sparkles />
          <AlertTitle>
            {suggestion.fromAi
              ? "Sugestão da IA"
              : "Quantidade calculada (sem a IA)"}
          </AlertTitle>
          <AlertDescription>{suggestion.reason}</AlertDescription>
        </Alert>
      )}
      {storeId ? (
        // Trocar a loja no topo recomeça o pedido: os itens e o custo sugerido são da loja anterior.
        <PurchaseOrderForm
          key={storeId}
          mode="create"
          storeId={storeId}
          prefill={prefill}
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
