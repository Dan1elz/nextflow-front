import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { SearchSelect } from "@/components/app/search-select";
import { VariantSalePicker } from "@/components/app/variant-sale-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { ClientOptionDto } from "@/interfaces/client.interface";
import type {
  OrderDetailDto,
  QuickSaleDto,
  QuickSalePreviewDto,
} from "@/interfaces/quick-sale.interface";
import type { VariantSaleOptionDto } from "@/interfaces/sale-option.interface";
import { clientService } from "@/services/client.service";
import { quickSaleService } from "@/services/quick-sale.service";
import { saleOptionService } from "@/services/sale-option.service";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import {
  PAYMENT_METHOD_LABELS,
  TPaymentMethod,
  type TSaleUnit,
} from "@/types/enums";
import { formatCurrency } from "@/utils/format.helpers";
import { SALE_UNIT_SHORT } from "@/utils/product.helpers";

interface CartLine {
  variantId: string;
  productName: string;
  variantLabel: string | null;
  sku: string;
  saleUnit: TSaleUnit;
  decimalPlaces: number;
  expectedUnitPrice: number;
  quantity: string;
  discount: string;
}

interface QuickSaleForm {
  clientId: string;
  items: CartLine[];
  payments: { method: TPaymentMethod; amount: string }[];
  cashReceived: string;
}

const EMPTY_FORM: QuickSaleForm = {
  clientId: "",
  items: [],
  payments: [{ method: TPaymentMethod.Pix, amount: "" }],
  cashReceived: "",
};

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Valor da API no formato do campo (vírgula decimal), sem recálculo. */
const toInputAmount = (value: number) => value.toFixed(2).replace(".", ",");

/** Corpo da API a partir do formulário; o preço e os totais ficam com a API (RN-VD02). */
function toDto(
  values: QuickSaleForm,
  storeId: string,
  confirmWarnings = false
): QuickSaleDto {
  return {
    storeId,
    clientId: values.clientId || null,
    items: values.items.map((item) => ({
      variantId: item.variantId,
      quantity: toNumber(item.quantity),
      discount: toNumber(item.discount),
      expectedUnitPrice: item.expectedUnitPrice,
    })),
    payments: values.payments
      .filter((payment) => payment.amount !== "")
      .map((payment) => ({
        method: payment.method,
        amount: toNumber(payment.amount),
      })),
    cashReceived: values.cashReceived ? toNumber(values.cashReceived) : null,
    confirmWarnings,
  };
}

/**
 * Venda rápida de balcão (T-VD2, RN-VD15): bipa ou busca, ajusta quantidade e desconto, paga e conclui. Sem caixa, TEF,
 * cupom ou offline. Rodapé (preço efetivo, totais, falta pagar e troco) vem da prévia da API; a conclusão revalida tudo.
 */
export default function QuickSalePage() {
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const [loadedPreview, setPreview] = useState<QuickSalePreviewDto | null>(
    null
  );
  const [done, setDone] = useState<OrderDetailDto | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const form = useForm<QuickSaleForm>({ defaultValues: EMPTY_FORM });
  const { submit, handleSubmit, confirmWarning } = useApiForm(form);
  const items = useFieldArray({ control: form.control, name: "items" });
  const payments = useFieldArray({ control: form.control, name: "payments" });
  const values = useWatch({ control: form.control }) as QuickSaleForm;
  const hasCash = values.payments?.some(
    (payment) => payment.method === TPaymentMethod.Cash
  );

  // Uma prévia por mudança consolidada: a chave é o corpo que a API recebe (nomes e rótulos não contam), só sai com o
  // carrinho em estado válido (quantidade digitada pela metade não vira 422) e a anterior é cancelada se outra chegar.
  const previewBody = useMemo(() => {
    if (!storeId || !values.items?.length) return "";
    const dto = toDto(values, storeId);
    const valid = dto.items.every(
      (item) => item.quantity > 0 && item.discount >= 0
    );
    if (!valid) return "";
    dto.payments = dto.payments.filter((payment) => payment.amount > 0);
    return JSON.stringify(dto);
  }, [values, storeId]);
  const previewKey = useDebounce(previewBody, 400);

  useEffect(() => {
    if (!previewKey || !token) return;
    const controller = new AbortController();
    quickSaleService
      .preview(JSON.parse(previewKey) as QuickSaleDto, token, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPreview(result);
      })
      // Linha recusada pela API: o rodapé some e o erro aparece ao concluir.
      .catch(() => {
        if (!controller.signal.aborted) setPreview(null);
      });
    return () => controller.abort();
  }, [previewKey, token]);

  const preview = values.items?.length ? loadedPreview : null;
  const previewTotal = preview?.total;

  // Uma forma de pagamento só: o valor acompanha o total da API enquanto o vendedor não digitar outro.
  const autoAmount = useRef<string | null>(null);
  useEffect(() => {
    if (previewTotal == null) return;
    const current = form.getValues("payments");
    if (current.length !== 1) return;
    const { amount } = current[0];
    if (amount !== "" && amount !== autoAmount.current) return;
    const next = toInputAmount(previewTotal);
    if (next === amount) return;
    autoAmount.current = next;
    form.setValue("payments.0.amount", next);
  }, [previewTotal, form]);

  // Outra forma já nasce com o que falta pagar (valor da prévia da API).
  const addPayment = () =>
    payments.append({
      method: TPaymentMethod.Cash,
      amount:
        preview && preview.remaining > 0
          ? toInputAmount(preview.remaining)
          : "",
    });

  const previewByVariant = useMemo(
    () => new Map(preview?.items.map((item) => [item.variantId, item]) ?? []),
    [preview]
  );

  const addOption = (option: VariantSaleOptionDto) => {
    const index = form
      .getValues("items")
      .findIndex((line) => line.variantId === option.variantId);
    if (index >= 0) {
      const line = form.getValues(`items.${index}`);
      items.update(index, {
        ...line,
        quantity: String(toNumber(line.quantity) + 1),
      });
      return;
    }
    items.append({
      variantId: option.variantId,
      productName: option.productName,
      variantLabel: option.variantLabel,
      sku: option.sku,
      saleUnit: option.saleUnit,
      decimalPlaces: option.decimalPlaces,
      expectedUnitPrice: option.effectivePrice,
      quantity: "1",
      discount: "0",
    });
  };

  const onSubmit = handleSubmit(async (formValues) => {
    if (!storeId) return;
    await submit(async (confirmWarnings) => {
      const order = await quickSaleService.create(
        toDto(formValues, storeId, confirmWarnings),
        token ?? undefined
      );
      setDone(order);
    });
  });

  // Preço mudou desde a busca (aviso `confirm` da API): rebusca cada linha pelo SKU e grava o preço efetivo atual como o
  // esperado, para o vendedor revisar o rodapé antes de concluir de novo.
  const refreshPrices = async () => {
    if (!storeId) return;
    setRefreshing(true);
    try {
      const lines = form.getValues("items");
      const found = await Promise.all(
        lines.map((line) =>
          saleOptionService.getVariantOptions(
            { search: line.sku, storeId, limit: 5 },
            token ?? undefined
          )
        )
      );
      lines.forEach((line, index) => {
        const option = found[index].find(
          (candidate) => candidate.variantId === line.variantId
        );
        if (option && option.effectivePrice !== line.expectedUnitPrice)
          items.update(index, {
            ...form.getValues(`items.${index}`),
            expectedUnitPrice: option.effectivePrice,
          });
      });
      handleSuccess("Preços atualizados. Revise o total e os pagamentos.");
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  };

  const newSale = () => {
    form.reset(EMPTY_FORM);
    autoAmount.current = null;
    setPreview(null);
    setDone(null);
  };

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Venda nº {done.number} concluída</AlertTitle>
          <AlertDescription>
            Total {formatCurrency(done.total)}
            {done.change != null && done.change > 0
              ? ` · troco ${formatCurrency(done.change)}`
              : ""}
          </AlertDescription>
        </Alert>
        <Button onClick={newSale} autoFocus>
          <Plus />
          Nova venda
        </Button>
      </div>
    );
  }

  const { isSubmitting } = form.formState;

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4"
    >
      <h1 className="text-2xl font-semibold">Venda rápida</h1>

      {!storeId && (
        <Alert>
          <AlertTitle>Selecione uma loja</AlertTitle>
          <AlertDescription>
            A venda nasce na loja escolhida no topo e baixa do local de venda
            padrão dela.
          </AlertDescription>
        </Alert>
      )}

      <VariantSalePicker onSelect={addOption} disabled={isSubmitting} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Carrinho</CardTitle>
          {items.fields.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshPrices}
              disabled={refreshing || isSubmitting}
            >
              {refreshing ? <Spinner /> : <RefreshCw />}
              Atualizar preços
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {items.fields.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart />
                </EmptyMedia>
                <EmptyTitle>Carrinho vazio</EmptyTitle>
                <EmptyDescription>
                  Bipe o código ou busque o produto acima.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            items.fields.map((line, index) => {
              const priced = previewByVariant.get(line.variantId);
              return (
                <div key={line.id} className="flex flex-col gap-2">
                  {index > 0 && <Separator />}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {line.productName}
                        {line.variantLabel && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {line.variantLabel}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {line.sku}
                        {priced &&
                          ` · ${formatCurrency(priced.unitPrice)} / ${SALE_UNIT_SHORT[line.saleUnit]}`}
                        {priced?.promotion &&
                          ` (−${priced.promotion.discountPercent}%)`}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remover item"
                      onClick={() => items.remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <FieldGroup className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Controller
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`qty-${line.id}`}>
                            Quantidade
                          </FieldLabel>
                          <Input
                            {...field}
                            id={`qty-${line.id}`}
                            inputMode="decimal"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`items.${index}.discount`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`disc-${line.id}`}>
                            Desconto (R$)
                          </FieldLabel>
                          <Input
                            {...field}
                            id={`disc-${line.id}`}
                            inputMode="decimal"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <div className="col-span-2 flex flex-col items-end justify-end sm:col-span-1">
                      <span className="text-xs text-muted-foreground">
                        Total da linha
                      </span>
                      <span className="font-medium tabular-nums">
                        {priced ? formatCurrency(priced.lineTotal) : "—"}
                      </span>
                    </div>
                  </FieldGroup>
                  {form.formState.errors.items?.[index]?.variantId && (
                    <FieldError
                      errors={[form.formState.errors.items[index]?.variantId]}
                    />
                  )}
                </div>
              );
            })
          )}
          {form.formState.errors.items?.root && (
            <FieldError errors={[form.formState.errors.items.root]} />
          )}
          {form.formState.errors.items?.message && (
            <FieldError errors={[form.formState.errors.items]} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cliente e pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={form.control}
              name="clientId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <SearchSelect<Record<string, unknown> & ClientOptionDto>
                    field={{
                      value: field.value,
                      onChange: (value) =>
                        field.onChange(value ? String(value) : ""),
                    }}
                    label="Cliente (opcional)"
                    data={[]}
                    onSearch={(search) =>
                      clientService.clientOptions(
                        search,
                        token ?? undefined
                      ) as Promise<
                        (Record<string, unknown> & ClientOptionDto)[]
                      >
                    }
                    getOptionLabel={(client) => client.label}
                    getOptionValue={(client) => client.id}
                    placeholder="Consumidor final"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {payments.fields.map((payment, index) => (
              <div key={payment.id} className="flex items-end gap-2">
                <Controller
                  control={form.control}
                  name={`payments.${index}.method`}
                  render={({ field }) => (
                    <Field className="flex-1">
                      <FieldLabel>Forma</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger aria-label="Forma de pagamento">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(TPaymentMethod).map((method) => (
                              <SelectItem key={method} value={method}>
                                {PAYMENT_METHOD_LABELS[method]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name={`payments.${index}.amount`}
                  render={({ field, fieldState }) => (
                    <Field className="flex-1" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`pay-${payment.id}`}>
                        Valor (R$)
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`pay-${payment.id}`}
                        inputMode="decimal"
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  )}
                />
                {payments.fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover pagamento"
                    onClick={() => payments.remove(index)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPayment}>
              <Plus />
              Outra forma
            </Button>
            {form.formState.errors.payments?.message && (
              <FieldError errors={[form.formState.errors.payments]} />
            )}

            {hasCash && (
              <Controller
                control={form.control}
                name="cashReceived"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cash-received">
                      Recebido em dinheiro (R$)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="cash-received"
                      inputMode="decimal"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <SummaryRow label="Subtotal" value={preview?.subtotal} />
          <SummaryRow label="Descontos" value={preview?.discountTotal} />
          <Separator />
          <SummaryRow label="Total" value={preview?.total} strong />
          {payments.fields.length > 1 && (
            <SummaryRow label="Soma dos pagamentos" value={preview?.paid} />
          )}
          <div
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-2 text-lg font-semibold",
              preview && preview.remaining > 0
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "bg-muted"
            )}
          >
            <span>Falta pagar</span>
            <span className="tabular-nums">
              {preview == null ? "—" : formatCurrency(preview.remaining)}
            </span>
          </div>
          {preview?.change != null && (
            <SummaryRow label="Troco" value={preview.change} />
          )}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !storeId || items.fields.length === 0}
          >
            {isSubmitting && <Spinner />}
            Concluir venda
          </Button>
        </CardContent>
      </Card>

      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number | undefined;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? "text-lg font-semibold" : "text-sm"}`}
    >
      <span className={strong ? undefined : "text-muted-foreground"}>
        {label}
      </span>
      <span className="tabular-nums">
        {value == null ? "—" : formatCurrency(value)}
      </span>
    </div>
  );
}
