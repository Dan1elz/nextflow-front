import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PurchaseOrderDetailDto,
  PurchaseOrderDetailItemDto,
  ReceivePurchaseLotDto,
} from "@/interfaces/purchase-order.interface";
import { parsePrice } from "@/schemas/product.schema";
import { formatNumber } from "@/utils/format.helpers";

/** Lotes por item (id do item), só dos itens que controlam lote. */
export type ReceiveLots = Record<string, ReceivePurchaseLotDto[]>;

interface LotRow {
  code: string;
  expiresOn: string;
  quantity: string;
}

interface ReceivePurchaseOrderDialogProps {
  open: boolean;
  order: PurchaseOrderDetailDto;
  onOpenChange: (open: boolean) => void;
  /** Resolve quando recebeu; rejeita para o pai mostrar o erro e manter o dialog aberto. */
  onConfirm: (lots: ReceiveLots) => Promise<void>;
}

const quantityText = (value: number) =>
  formatNumber(value, Number.isInteger(value) ? 0 : 3);

const emptyRows = (order: PurchaseOrderDetailDto): Record<string, LotRow[]> =>
  Object.fromEntries(
    order.items
      .filter((item) => item.tracksLots)
      .map((item) => [
        item.id,
        [{ code: "", expiresOn: "", quantity: quantityText(item.quantity) }],
      ])
  );

/**
 * Confere o que dá para conferir na tela (F1.7): código, validade e soma dos lotes igual à quantidade do item. Código
 * repetido com outra validade e lote de outro produto só a API sabe.
 */
function checkLots(
  item: PurchaseOrderDetailItemDto,
  rows: LotRow[]
): string | null {
  if (rows.length === 0) return "Informe ao menos um lote.";
  if (rows.some((row) => !row.code.trim()))
    return "Informe o código de cada lote.";
  if (rows.some((row) => !row.expiresOn))
    return "Informe a validade de cada lote.";
  const codes = rows.map((row) => row.code.trim().toUpperCase());
  if (new Set(codes).size !== codes.length)
    return "O mesmo lote aparece duas vezes.";
  const quantities = rows.map((row) => parsePrice(row.quantity));
  if (quantities.some((quantity) => !(quantity > 0)))
    return "A quantidade de cada lote precisa ser maior que zero.";
  const total = quantities.reduce((sum, quantity) => sum + quantity, 0);
  if (Math.abs(total - item.quantity) > 0.0005)
    return `Os lotes somam ${quantityText(total)}, mas o item tem ${quantityText(item.quantity)}.`;
  return null;
}

/**
 * Recebimento (T-CP4): o pedido inteiro, sem recebimento parcial (RN-CP04). Quantidades só leitura; divergência é
 * ajuste de estoque depois (L-CP1). Item que controla lote (F1.7) informa código, validade e quantidade de cada lote que
 * chegou; os lotes somam a quantidade do item.
 */
export function ReceivePurchaseOrderDialog({
  open,
  order,
  onOpenChange,
  onConfirm,
}: ReceivePurchaseOrderDialogProps) {
  const [receiving, setReceiving] = useState(false);
  const [rows, setRows] = useState<Record<string, LotRow[]>>(() =>
    emptyRows(order)
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setRows(emptyRows(order));
      setSubmitted(false);
    }
  }, [open, order]);

  const lotItems = order.items.filter((item) => item.tracksLots);
  const errors = Object.fromEntries(
    lotItems.map((item) => [item.id, checkLots(item, rows[item.id] ?? [])])
  );

  const updateRow = (itemId: string, index: number, patch: Partial<LotRow>) =>
    setRows((current) => ({
      ...current,
      [itemId]: current[itemId].map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }));

  const addRow = (itemId: string) =>
    setRows((current) => ({
      ...current,
      [itemId]: [...current[itemId], { code: "", expiresOn: "", quantity: "" }],
    }));

  const removeRow = (itemId: string, index: number) =>
    setRows((current) => ({
      ...current,
      [itemId]: current[itemId].filter((_, i) => i !== index),
    }));

  const handleConfirm = async () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;

    const lots: ReceiveLots = Object.fromEntries(
      lotItems.map((item) => [
        item.id,
        rows[item.id].map((row) => ({
          code: row.code.trim(),
          expiresOn: row.expiresOn,
          quantity: parsePrice(row.quantity),
        })),
      ])
    );

    setReceiving(true);
    try {
      await onConfirm(lots);
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Receber pedido nº {order.number}?</DialogTitle>
          <DialogDescription>
            Todos os itens entram no estoque de{" "}
            {order.receiveLocation.storeName} › {order.receiveLocation.name}{" "}
            agora, e o custo médio é recalculado. Se veio diferente, receba e
            lance um ajuste de estoque depois.
            {lotItems.length > 0 &&
              " Nos itens com lote, informe o código e a validade de cada lote que chegou."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[28rem] overflow-auto rounded-md border">
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
                <TableRow key={item.id} className="align-top">
                  <TableCell className="whitespace-normal">
                    {item.productName}
                    {item.variantLabel && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.variantLabel}
                      </span>
                    )}
                    {item.tracksLots && (
                      <div className="mt-2 flex flex-col gap-2">
                        {(rows[item.id] ?? []).map((row, index) => (
                          <div
                            key={index}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <Input
                              aria-label="Código do lote"
                              placeholder="Lote"
                              className="w-32"
                              maxLength={40}
                              value={row.code}
                              disabled={receiving}
                              onChange={(event) =>
                                updateRow(item.id, index, {
                                  code: event.target.value,
                                })
                              }
                            />
                            <Input
                              aria-label="Validade"
                              type="date"
                              className="w-40"
                              value={row.expiresOn}
                              disabled={receiving}
                              onChange={(event) =>
                                updateRow(item.id, index, {
                                  expiresOn: event.target.value,
                                })
                              }
                            />
                            <Input
                              aria-label="Quantidade do lote"
                              inputMode="decimal"
                              placeholder="Qtd."
                              className="w-24 text-right"
                              value={row.quantity}
                              disabled={receiving}
                              onChange={(event) =>
                                updateRow(item.id, index, {
                                  quantity: event.target.value,
                                })
                              }
                            />
                            {(rows[item.id] ?? []).length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Remover lote"
                                disabled={receiving}
                                onClick={() => removeRow(item.id, index)}
                              >
                                <Trash2Icon />
                              </Button>
                            )}
                          </div>
                        ))}
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={receiving}
                            onClick={() => addRow(item.id)}
                          >
                            <PlusIcon data-icon="inline-start" />
                            Outro lote
                          </Button>
                        </div>
                        {submitted && errors[item.id] && (
                          <p className="text-sm text-destructive">
                            {errors[item.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right">
                    {quantityText(item.quantity)}
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
