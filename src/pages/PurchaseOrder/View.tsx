import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Pencil, Send } from "lucide-react";

import { CancelPurchaseOrderDialog } from "@/components/app/cancel-purchase-order-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PurchaseStatusBadge } from "@/components/app/purchase-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { PurchaseOrderDetailDto } from "@/interfaces/purchase-order.interface";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { TPurchaseStatus } from "@/types/enums";
import {
  formatCpfCnpj,
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatNumber,
} from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value ?? "-"}</span>
    </div>
  );
}

function ViewPurchaseOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getPurchaseOrder, sendPurchaseOrder, cancelPurchaseOrder } =
    usePurchaseOrders();
  const [order, setOrder] = useState<PurchaseOrderDetailDto | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setOrder(await getPurchaseOrder(id));
    } catch (error) {
      handleError(error, "Erro ao buscar pedido de compra");
      navigate("/purchase-orders");
    }
  }, [getPurchaseOrder, id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    if (!order) return;
    setSending(true);
    try {
      setOrder(await sendPurchaseOrder(order.id, order.version));
      handleSuccess("Pedido enviado ao fornecedor");
      setSendOpen(false);
    } catch (error) {
      handleError(error, "Erro ao enviar o pedido");
      await load();
    } finally {
      setSending(false);
    }
  };

  if (!order)
    return (
      <div className="container mx-auto max-w-7xl p-4 pt-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );

  const isOpen =
    order.status === TPurchaseStatus.Budget ||
    order.status === TPurchaseStatus.Pending;

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-4 p-4 pt-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Voltar"
              onClick={() => navigate("/purchase-orders")}
            >
              <ArrowLeft />
            </Button>
            <CardTitle>Pedido de compra nº {order.number}</CardTitle>
            <PurchaseStatusBadge status={order.status} />
          </div>
          {isOpen && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/purchase-orders/${order.id}/edit`)}
              >
                <Pencil data-icon="inline-start" />
                Editar
              </Button>
              {order.status === TPurchaseStatus.Budget && (
                <Button onClick={() => setSendOpen(true)}>
                  <Send data-icon="inline-start" />
                  Enviar ao fornecedor
                </Button>
              )}
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                <Ban data-icon="inline-start" />
                Cancelar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {order.status === TPurchaseStatus.Canceled && (
            <Alert>
              <AlertTitle>
                Cancelado em{" "}
                {order.canceledAt ? formatDateTime(order.canceledAt) : "-"}
              </AlertTitle>
              <AlertDescription>{order.cancelReason}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Fornecedor" value={order.supplier.name} />
            <Info label="CNPJ" value={formatCpfCnpj(order.supplier.cnpj)} />
            <Info label="Contato" value={order.supplier.mainContact} />
            <Info
              label="Local de entrega"
              value={`${order.receiveLocation.storeName} › ${order.receiveLocation.name}`}
            />
            <Info
              label="Criado"
              value={`${formatDateTime(order.createdAt)} por ${order.createdByName}`}
            />
            <Info
              label="Enviado em"
              value={order.sentAt ? formatDateTime(order.sentAt) : null}
            />
            <Info
              label="Previsão de chegada"
              value={
                order.expectedOn
                  ? `${formatDateOnly(order.expectedOn)} (${order.leadTimeDays} dia(s))`
                  : null
              }
            />
            <Info label="Total" value={formatCurrency(order.total)} />
          </div>
          {order.note && <Info label="Observação" value={order.note} />}
          <Separator />
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Código no fornecedor</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.productName}
                      {item.variantLabel && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {item.variantLabel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.supplierSku ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(
                        item.quantity,
                        Number.isInteger(item.quantity) ? 0 : 3
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitCost, "BRL", 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={sendOpen} onOpenChange={setSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Enviar o pedido nº {order.number} ao fornecedor?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O pedido passa a Pendente e a previsão de chegada conta a partir
              de hoje. Ele ainda pode ser editado ou cancelado até o
              recebimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sending}
              onClick={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              {sending && <Spinner data-icon="inline-start" />}
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CancelPurchaseOrderDialog
        open={cancelOpen}
        number={order.number}
        onOpenChange={setCancelOpen}
        onConfirm={async (reason) => {
          setOrder(await cancelPurchaseOrder(order.id, order.version, reason));
          handleSuccess("Pedido de compra cancelado");
        }}
      />
    </div>
  );
}

export default function ViewPurchaseOrderPageWrapper() {
  return (
    <PurchaseOrdersProvider>
      <ViewPurchaseOrder />
    </PurchaseOrdersProvider>
  );
}
