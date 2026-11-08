import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarClock, Store, Truck } from "lucide-react";

import { SearchSelect } from "@/components/app/search-select";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useApplyPurchase,
  type PurchaseRecommendationView,
} from "@/hooks/use-apply-purchase";
import type { IOption } from "@/interfaces/api.interface";
import type {
  IApplyPurchaseResult,
  IForecastRecommendationListItem,
} from "@/interfaces/forecast.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import { supplierService } from "@/services/supplier.service";
import {
  getLineWarnings,
  lineKey,
  parseDecimal,
  type PurchaseLine,
} from "@/utils/apply-purchase.helpers";
import {
  formatCurrency,
  formatDateOnly,
  formatNumber,
} from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type ApplyPurchaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recomendações Comprar pendentes: uma ou várias (T-DF4). */
  recommendations: IForecastRecommendationListItem[];
  onApplied?: (result: IApplyPurchaseResult) => void;
};

type Hook = ReturnType<typeof useApplyPurchase>;

function lineTotal(line: PurchaseLine) {
  const quantity = parseDecimal(line.quantity);
  const cost = parseDecimal(line.unitCost);
  return quantity > 0 && cost >= 0 ? quantity * cost : 0;
}

function viewTotal(items: PurchaseRecommendationView[]) {
  return items.reduce(
    (sum, item) =>
      sum + item.lines.reduce((acc, line) => acc + lineTotal(line), 0),
    0
  );
}

function LineRow({
  line,
  item,
  hook,
}: {
  line: PurchaseLine;
  item: PurchaseRecommendationView;
  hook: Hook;
}) {
  const { detail } = item;
  const unit = detail.saleUnit;
  const decimals = detail.decimalPlaces;
  const qtyError = hook.lineError(line, "quantity");
  const costError = hook.lineError(line, "unitCost");
  const warnings = getLineWarnings(
    parseDecimal(line.quantity),
    detail.calculation
  );
  const variantLabel =
    detail.variantSplit.find((s) => s.variantId === line.variantId)
      ?.variantLabel ?? null;
  const id = `purchase-${line.recommendationId}-${line.variantId}`;
  const offMultiple = warnings.offMultiple;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_6rem] sm:items-start">
        <span className="col-span-2 text-sm font-medium sm:col-span-1 sm:pt-2">
          {variantLabel ?? "Quantidade e custo"}
        </span>
        <Field data-invalid={!!qtyError}>
          <FieldLabel htmlFor={`${id}-qty`} className="text-xs sm:sr-only">
            Quantidade ({unit})
          </FieldLabel>
          <Input
            id={`${id}-qty`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            aria-label={`Quantidade de ${line.name}`}
            aria-invalid={!!qtyError}
            value={line.quantity}
            disabled={hook.submitting}
            onChange={(e) => hook.setLine(line, { quantity: e.target.value })}
          />
          {qtyError && <FieldError>{qtyError}</FieldError>}
        </Field>
        <Field data-invalid={!!costError}>
          <FieldLabel htmlFor={`${id}-cost`} className="text-xs sm:sr-only">
            Custo unitário (R$)
          </FieldLabel>
          <Input
            id={`${id}-cost`}
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            aria-label={`Custo unitário de ${line.name}`}
            aria-invalid={!!costError}
            value={line.unitCost}
            disabled={hook.submitting}
            onChange={(e) => hook.setLine(line, { unitCost: e.target.value })}
          />
          {costError && <FieldError>{costError}</FieldError>}
          {!costError &&
            line.unitCost === "" &&
            hook.missingCost.has(lineKey(line)) && (
              <FieldDescription className="text-xs">
                Sem custo anterior: informe o da cotação.
              </FieldDescription>
            )}
        </Field>
        <span className="col-span-2 text-right text-sm font-semibold tabular-nums sm:col-span-1 sm:pt-2">
          {formatCurrency(lineTotal(line))}
        </span>
      </div>
      {(warnings.belowMinimum !== null || offMultiple) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {warnings.belowMinimum !== null && (
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="size-3 text-warning" />
              Abaixo do pedido mínimo de{" "}
              {formatNumber(warnings.belowMinimum, decimals)} {unit}.
            </span>
          )}
          {offMultiple && (
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="size-3 text-warning" />
              Fora do múltiplo de {formatNumber(
                offMultiple.multiple,
                decimals
              )}{" "}
              {unit}.
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                disabled={hook.submitting}
                onClick={() =>
                  hook.setLine(line, { quantity: String(offMultiple.rounded) })
                }
              >
                Arredondar para {formatNumber(offMultiple.rounded, decimals)}
              </Button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ProductHeader({ rec }: { rec: IForecastRecommendationListItem }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm font-semibold">{rec.productName}</span>
      <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>
          Sugerido:{" "}
          <span className="font-medium text-foreground">
            {formatNumber(rec.suggestedQuantity ?? 0, rec.decimalPlaces)}{" "}
            {rec.saleUnit}
          </span>
        </span>
        {rec.deadline && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3" />
            comprar até {formatDateOnly(rec.deadline)}
          </span>
        )}
      </span>
    </div>
  );
}

function Lines({
  item,
  hook,
}: {
  item: PurchaseRecommendationView;
  hook: Hook;
}) {
  if (item.lines.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Sem variação no rateio desta recomendação.
      </p>
    );
  return item.lines.map((line) => (
    <LineRow key={line.variantId} line={line} item={item} hook={hook} />
  ));
}

/**
 * Dividir a compra entre lojas (RN-DF27): a API sugere quanto vai para cada loja pela falta dela; o Admin ajusta. Cada loja vira
 * um pedido no local de recebimento dela.
 */
function StoreSplitSection({
  item,
  hook,
}: {
  item: PurchaseRecommendationView;
  hook: Hook;
}) {
  const recId = item.recommendation.id;
  const split = hook.splits[recId];
  const loading = hook.splitLoading === recId;
  const { detail } = item;
  const label = (variantId: string) =>
    detail.variantSplit.find((s) => s.variantId === variantId)?.variantLabel ??
    null;
  const switchId = `split-${recId}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={split != null}
          disabled={loading || hook.submitting}
          onCheckedChange={(on) =>
            on ? void hook.enableSplit(recId) : hook.disableSplit(recId)
          }
        />
        <Label htmlFor={switchId} className="text-sm font-normal">
          Dividir entre lojas
        </Label>
        {loading && <Spinner />}
      </div>
      {split && (
        <div className="flex flex-col divide-y rounded-lg border">
          {split.stores.map((store) => (
            <div key={store.storeId} className="flex flex-col gap-2 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Store className="size-4 text-muted-foreground" />
                  {store.storeName}
                  {store.receiveLocationName && (
                    <span className="text-xs font-normal text-muted-foreground">
                      › {store.receiveLocationName}
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(store.sharePercent, 0)}% das vendas · saldo{" "}
                  {formatNumber(store.currentStock, detail.decimalPlaces)} · a
                  caminho{" "}
                  {formatNumber(store.incomingStock, detail.decimalPlaces)} ·
                  falta {formatNumber(store.shortfall, detail.decimalPlaces)}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {item.lines.map((line) => {
                  const id = `split-${recId}-${store.storeId}-${line.variantId}`;
                  const error =
                    hook.errors[
                      `split:${recId}:${store.storeId}:${line.variantId}`
                    ];
                  return (
                    <Field key={line.variantId} data-invalid={!!error}>
                      <FieldLabel
                        htmlFor={id}
                        className="text-xs text-muted-foreground"
                      >
                        {label(line.variantId) ?? "Quantidade"}
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={id}
                          inputMode="decimal"
                          className="tabular-nums"
                          value={
                            split.quantities[store.storeId]?.[line.variantId] ??
                            ""
                          }
                          disabled={hook.submitting}
                          aria-invalid={!!error}
                          onChange={(e) =>
                            hook.setSplitQuantity(
                              recId,
                              store.storeId,
                              line.variantId,
                              e.target.value
                            )
                          }
                        />
                        <InputGroupAddon align="inline-end">
                          {detail.saleUnit}
                        </InputGroupAddon>
                      </InputGroup>
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="p-3 text-xs text-muted-foreground">
            Sugestão pela falta de cada loja (parte dela na demanda menos saldo
            e o que está a caminho). Cada loja vira um pedido no local de
            recebimento dela; a quantidade da linha acima é a soma.
          </p>
        </div>
      )}
    </div>
  );
}

function LocationField({
  supplierId,
  value,
  locations,
  hook,
}: {
  supplierId: string;
  value: string;
  locations: LocationOptionDto[];
  hook: Hook;
}) {
  const error = hook.errors[`group:${supplierId}:receiveLocationId`];
  const id = `purchase-location-${supplierId}`;
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>Local de entrega</FieldLabel>
      <Select
        value={value}
        onValueChange={(next) => hook.setLocation(supplierId, next)}
        disabled={hook.submitting}
      >
        <SelectTrigger id={id} aria-invalid={!!error}>
          <SelectValue placeholder="Escolha o local" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.storeName} · {location.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

function ChooseSupplierSection({ hook }: { hook: Hook }) {
  const { token } = useAuth();
  const [options, setOptions] = useState<IOption[]>([]);
  const search = async (term: string) => {
    const found = (await supplierService.options(
      term,
      token ?? undefined
    )) as IOption[];
    setOptions(found);
    return found;
  };

  return (
    <section
      aria-labelledby="purchase-choose-supplier"
      className="rounded-lg border border-dashed"
    >
      <h3
        id="purchase-choose-supplier"
        className="border-b px-3 py-2 text-sm font-semibold"
      >
        Escolha o fornecedor
      </h3>
      <div className="flex flex-col divide-y">
        {hook.unassigned.map((item) => {
          const recId = item.recommendation.id;
          const error = hook.errors[`supplier:${recId}`];
          return (
            <div key={recId} className="flex flex-col gap-3 p-3">
              <ProductHeader rec={item.recommendation} />
              <Field data-invalid={!!error}>
                <SearchSelect<IOption>
                  label="Fornecedor"
                  data={options}
                  onSearch={search}
                  placeholder="Digite para buscar"
                  disabled={hook.submitting}
                  // Ao escolher, o produto sai desta seção e entra no grupo do fornecedor.
                  field={{
                    value: undefined,
                    onChange: (value) => {
                      const picked = options.find(
                        (o) => o.value === String(value)
                      );
                      if (picked?.value)
                        hook.chooseSupplier(recId, {
                          id: String(picked.value),
                          name: String(picked.label ?? ""),
                        });
                    },
                  }}
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <Lines item={item} hook={hook} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApplyPurchaseContent({
  recommendations,
  onClose,
  onApplied,
}: {
  recommendations: IForecastRecommendationListItem[];
  onClose: () => void;
  onApplied?: (result: IApplyPurchaseResult) => void;
}) {
  const navigate = useNavigate();
  const hook = useApplyPurchase(recommendations);
  const { groups, unassigned } = hook;
  const many = recommendations.length > 1;
  const ordersCount = groups.length + (unassigned.length > 0 ? 1 : 0);
  const total = groups.reduce((sum, g) => sum + viewTotal(g.items), 0);

  const handleSubmit = async () => {
    try {
      const result = await hook.submit();
      if (!result) return;
      const orders = result.purchaseOrders;
      if (orders.length === 1)
        handleSuccess("Pedido de compra criado como Orçamento.", {
          description: `${orders[0].supplierName} · ${formatCurrency(orders[0].total)}`,
          action: {
            label: "Ver pedido",
            onClick: () => navigate(`/purchase-orders/${orders[0].id}/view`),
          },
        });
      else
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
      onApplied?.(result);
      onClose();
    } catch (error) {
      handleError(error, "Erro ao gerar o pedido de compra");
    }
  };

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>
          {many
            ? `Comprar ${recommendations.length} produtos`
            : "Gerar pedido de compra"}
        </DialogTitle>
        <DialogDescription>
          Um pedido em Orçamento por fornecedor (e por loja, se dividir). Os
          avisos não impedem gerar o pedido.
        </DialogDescription>
      </DialogHeader>

      {hook.loadError ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{hook.loadError}</AlertTitle>
        </Alert>
      ) : !hook.loaded ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <FieldGroup className="gap-4">
          {groups.map((group) => (
            <section
              key={group.supplierId}
              aria-label={group.supplierName}
              className="rounded-lg border"
            >
              <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <Truck className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{group.supplierName}</span>
                </span>
                <span className="whitespace-nowrap text-sm font-medium tabular-nums">
                  {formatCurrency(viewTotal(group.items))}
                </span>
              </div>
              <div className="p-3 pb-0">
                {group.needsLocation ? (
                  <LocationField
                    supplierId={group.supplierId}
                    value={group.receiveLocationId}
                    locations={hook.locations}
                    hook={hook}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Dividido por loja: cada loja recebe no próprio local de
                    recebimento.
                  </p>
                )}
              </div>
              <div className="flex flex-col divide-y">
                {group.items.map((item) => (
                  <div
                    key={item.recommendation.id}
                    className="flex flex-col gap-3 p-3"
                  >
                    <ProductHeader rec={item.recommendation} />
                    <Lines item={item} hook={hook} />
                    <StoreSplitSection item={item} hook={hook} />
                  </div>
                ))}
              </div>
              <div className="p-3 pt-0">
                <Field>
                  <FieldLabel htmlFor={`purchase-note-${group.supplierId}`}>
                    Observação (opcional)
                  </FieldLabel>
                  <Textarea
                    id={`purchase-note-${group.supplierId}`}
                    value={group.note}
                    onChange={(e) =>
                      hook.setNote(group.supplierId, e.target.value)
                    }
                    placeholder="Vai para a nota do pedido de compra."
                    className="min-h-[60px] resize-y"
                    maxLength={500}
                    disabled={hook.submitting}
                  />
                </Field>
              </div>
            </section>
          ))}

          {unassigned.length > 0 && <ChooseSupplierSection hook={hook} />}

          {hook.formError && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{hook.formError}</AlertTitle>
            </Alert>
          )}

          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {ordersCount > 1
                ? `${ordersCount} pedidos de compra`
                : "Total do pedido"}
            </span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </FieldGroup>
      )}

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={hook.submitting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={hook.submitting || !hook.loaded}
        >
          {hook.submitting && <Spinner data-icon="inline-start" />}
          {many || ordersCount > 1 ? "Gerar pedidos" : "Gerar pedido de compra"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Dialog "Comprar" (T-DF4) → `POST /forecasts/recommendations/purchase`, um pedido por fornecedor. */
export function ApplyPurchaseDialog({
  open,
  onOpenChange,
  recommendations,
  onApplied,
}: ApplyPurchaseDialogProps) {
  const contentKey = recommendations.map((r) => r.id).join("|");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {open && (
          <ApplyPurchaseContent
            key={contentKey}
            recommendations={recommendations}
            onClose={() => onOpenChange(false)}
            onApplied={onApplied}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
