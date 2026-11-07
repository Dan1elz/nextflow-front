import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PurchaseOrderDetailDto } from "@/interfaces/purchase-order.interface";
import { formatNumber } from "@/utils/format.helpers";

interface ReceivePurchaseOrderDialogProps {
  open: boolean;
  order: PurchaseOrderDetailDto;
  onOpenChange: (open: boolean) => void;
  /** Resolve quando recebeu; rejeita para o pai mostrar o erro e manter o dialog aberto. */
  onConfirm: () => Promise<void>;
}

/**
 * Recebimento (T-CP4): o pedido inteiro, sem recebimento parcial (RN-CP04). Quantidades só leitura; divergência é
 * ajuste de estoque depois (L-CP1). Lote ainda não existe (F1.7): o item com lote entra sem lote.
 */
export function ReceivePurchaseOrderDialog({
  open,
  order,
  onOpenChange,
  onConfirm,
}: ReceivePurchaseOrderDialogProps) {
  const [receiving, setReceiving] = useState(false);
  const hasLotItems = order.items.some((item) => item.tracksLots);

  const handleConfirm = async () => {
    setReceiving(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // O pai já mostrou o erro.
    } finally {
      setReceiving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !receiving && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receber pedido nº {order.number}?</DialogTitle>
          <DialogDescription>
            Todos os itens entram no estoque de{" "}
            {order.receiveLocation.storeName} › {order.receiveLocation.name}{" "}
            agora, e o custo médio é recalculado. Se veio diferente, receba e
            lance um ajuste de estoque depois.
          </DialogDescription>
        </DialogHeader>
        {hasLotItems && (
          <Alert>
            <AlertDescription>
              O controle de lote ainda não está disponível: os itens com lote
              entram sem lote e sem validade.
            </AlertDescription>
          </Alert>
        )}
        <div className="max-h-80 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
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
                  <TableCell className="text-right">
                    {formatNumber(
                      item.quantity,
                      Number.isInteger(item.quantity) ? 0 : 3
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={receiving}
            onClick={() => onOpenChange(false)}
          >
            Voltar
          </Button>
          <Button type="button" disabled={receiving} onClick={handleConfirm}>
            {receiving && <Spinner data-icon="inline-start" />}
            Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
