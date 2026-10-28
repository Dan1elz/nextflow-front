import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Info, Trash2, Truck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ButtonLoader } from "@/components/ui/button-loader";
import { useForecast } from "@/hooks/use-forecast";
import type {
  IApplyPurchaseResult,
  IForecastRecommendation,
} from "@/interfaces/forecast.interface";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatCurrency, formatDateOnly } from "@/utils/format.helpers";
import { formatQuantity, getUnitShortLabel } from "@/utils/forecast.helpers";
import { cn } from "@/lib/utils";

type ApplyPurchaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recomendações de compra (Action = Buy, Status = Pending). Pode ser 1 ou várias. */
  recommendations: IForecastRecommendation[];
  onSuccess?: (result: IApplyPurchaseResult) => void;
};

type PurchaseRow = {
  recommendation: IForecastRecommendation;
  quantity: string;
  costPrice: string;
};

function toNumber(value: string): number {
  if (!value) return NaN;
  return Number(value.replace(",", "."));
}

function ApplyPurchaseContent({
  recommendations,
  onClose,
  onSuccess,
}: {
  recommendations: IForecastRecommendation[];
  onClose: () => void;
  onSuccess?: (result: IApplyPurchaseResult) => void;
}) {
  const navigate = useNavigate();
  const { applyPurchase } = useForecast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<PurchaseRow[]>(() =>
    recommendations.map((rec) => ({
      recommendation: rec,
      quantity:
        rec.suggestedQuantity !== undefined && rec.suggestedQuantity !== null
          ? String(rec.suggestedQuantity)
          : "",
      costPrice:
        rec.product.costPrice !== undefined && rec.product.costPrice !== null
          ? String(rec.product.costPrice)
          : "",
    }))
  );

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { supplierId: string; supplierName: string; rows: PurchaseRow[] }
    >();
    for (const row of rows) {
      const { supplierId, supplierName } = row.recommendation.product;
      const key = supplierId || "sem-fornecedor";
      if (!map.has(key))
        map.set(key, {
          supplierId: key,
          supplierName: supplierName || "Fornecedor não informado",
          rows: [],
        });
      map.get(key)!.rows.push(row);
    }
    return [...map.values()];
  }, [rows]);

  const rowErrors = (row: PurchaseRow) => {
    const qty = toNumber(row.quantity);
    const cost = toNumber(row.costPrice);
    return {
      quantity: !(qty > 0) ? "Informe uma quantidade maior que zero." : null,
      costPrice: !(cost > 0) ? "Informe um custo maior que zero." : null,
    };
  };

  const isValid = rows.every((row) => {
    const errors = rowErrors(row);
    return !errors.quantity && !errors.costPrice;
  });

  const total = rows.reduce((acc, row) => {
    const qty = toNumber(row.quantity);
    const cost = toNumber(row.costPrice);
    return qty > 0 && cost > 0 ? acc + qty * cost : acc;
  }, 0);

  const updateRow = (id: string, patch: Partial<PurchaseRow>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.recommendation.id === id ? { ...row, ...patch } : row
      )
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.recommendation.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid || rows.length === 0) return;

    try {
      setIsLoading(true);
      const result = await applyPurchase({
        items: rows.map((row) => ({
          recommendationId: row.recommendation.id,
          quantity: toNumber(row.quantity),
          costPrice: toNumber(row.costPrice),
        })),
        note: note.trim() ? note.trim() : undefined,
      });

      const orders = result.purchaseOrders ?? [];
      if (orders.length === 1 && orders[0].id) {
        const order = orders[0];
        handleSuccess("Pedido de compra criado como Orçamento.", {
          description: `${order.supplier?.name ?? "Fornecedor"} · ${formatCurrency(Number(order.totalAmount ?? 0))}`,
          action: {
            label: "Ver pedido",
            onClick: () => navigate(`/purchase-orders/${order.id}/view`),
          },
        });
      } else {
        handleSuccess(
          `${orders.length} pedidos de compra criados como Orçamento.`,
          {
            description: "Um pedido por fornecedor.",
            action: {
              label: "Ver pedidos",
              onClick: () => navigate("/purchase-orders"),
            },
          }
        );
      }

      onSuccess?.(result);
      onClose();
    } catch (error) {
      handleError(error, "Erro ao gerar o pedido de compra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>
          {rows.length > 1
            ? `Comprar ${rows.length} produtos`
            : "Gerar pedido de compra"}
        </DialogTitle>
        <DialogDescription>
          Revise as quantidades e custos. Será criado um pedido de compra com
          status <strong>Orçamento</strong> por fornecedor.
        </DialogDescription>
      </DialogHeader>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum item selecionado.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const groupTotal = group.rows.reduce((acc, row) => {
              const qty = toNumber(row.quantity);
              const cost = toNumber(row.costPrice);
              return qty > 0 && cost > 0 ? acc + qty * cost : acc;
            }, 0);

            return (
              <div key={group.supplierId} className="rounded-lg border">
                <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{group.supplierName}</span>
                  </span>
                  <span className="whitespace-nowrap text-sm font-medium">
                    {formatCurrency(groupTotal)}
                  </span>
                </div>

                <div className="divide-y">
                  {group.rows.map((row) => {
                    const rec = row.recommendation;
                    const errors = rowErrors(row);
                    const unit = getUnitShortLabel(rec.product.unitType);
                    const qtyId = `qty-${rec.id}`;
                    const costId = `cost-${rec.id}`;

                    return (
                      <div key={rec.id} className="flex flex-col gap-3 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {rec.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cód. {rec.product.productCode}
                              {rec.product.brand
                                ? ` · ${rec.product.brand}`
                                : ""}
                              {" · "}Estoque:{" "}
                              {formatQuantity(
                                rec.currentStock,
                                rec.product.unitType
                              )}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              <span>
                                Sugerido:{" "}
                                <span className="font-medium text-foreground">
                                  {formatQuantity(
                                    rec.suggestedQuantity,
                                    rec.product.unitType
                                  )}
                                </span>
                              </span>
                              {rec.deadline && (
                                <span className="inline-flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  comprar até {formatDateOnly(rec.deadline)}
                                </span>
                              )}
                            </p>
                          </div>
                          {rows.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRow(rec.id)}
                              aria-label="Remover item"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <div className="grid gap-1.5">
                            <Label htmlFor={qtyId} className="text-xs">
                              Quantidade ({unit})
                            </Label>
                            <Input
                              id={qtyId}
                              type="number"
                              min={0}
                              step="any"
                              value={row.quantity}
                              disabled={isLoading}
                              className={cn(
                                submitted &&
                                  errors.quantity &&
                                  "border-destructive"
                              )}
                              onChange={(e) =>
                                updateRow(rec.id, { quantity: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor={costId} className="text-xs">
                              Custo unitário (R$)
                            </Label>
                            <Input
                              id={costId}
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0,00"
                              value={row.costPrice}
                              disabled={isLoading}
                              className={cn(
                                submitted &&
                                  errors.costPrice &&
                                  "border-destructive"
                              )}
                              onChange={(e) =>
                                updateRow(rec.id, {
                                  costPrice: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-between text-sm sm:col-span-1 sm:block sm:pb-2 sm:text-right">
                            <span className="text-xs text-muted-foreground sm:hidden">
                              Subtotal
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(
                                (toNumber(row.quantity) || 0) *
                                  (toNumber(row.costPrice) || 0)
                              )}
                            </span>
                          </div>
                        </div>

                        {submitted && (errors.quantity || errors.costPrice) && (
                          <p className="text-xs text-destructive">
                            {errors.quantity ?? errors.costPrice}
                          </p>
                        )}
                        {!rec.product.costPrice && !row.costPrice && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Info className="h-3 w-3" />
                            Produto sem custo cadastrado — informe o custo da
                            cotação.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="grid gap-1.5">
            <Label htmlFor="purchase-note">Observação (opcional)</Label>
            <Textarea
              id="purchase-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Será adicionada à nota do pedido de compra."
              className="min-h-[60px] resize-y"
              maxLength={500}
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {groups.length > 1
                ? `${groups.length} pedidos de compra`
                : "Total do pedido"}
            </span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || rows.length === 0 || (submitted && !isValid)}
        >
          <ButtonLoader isLoading={isLoading} loadingText="Gerando pedido...">
            {groups.length > 1 ? "Gerar pedidos" : "Gerar pedido de compra"}
          </ButtonLoader>
        </Button>
      </DialogFooter>
    </>
  );
}

/** Dialog "Comprar" → POST /forecasts/recommendations/purchase (todos os itens em uma única requisição). */
export function ApplyPurchaseDialog({
  open,
  onOpenChange,
  recommendations,
  onSuccess,
}: ApplyPurchaseDialogProps) {
  const contentKey = recommendations.map((r) => r.id).join("|");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {open && (
          <ApplyPurchaseContent
            key={contentKey}
            recommendations={recommendations}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
