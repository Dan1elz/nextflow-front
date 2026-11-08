import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  CheckCircle2,
  Eye,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  UserPlus,
} from "lucide-react";

import { ClientQuickCreateDialog } from "@/components/app/client-quick-create-dialog";
import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { SaleDetailDialog } from "@/components/app/sale-detail-dialog";
import { SearchSelect } from "@/components/app/search-select";
import {
  VariantSalePicker,
  type VariantSalePickerHandle,
} from "@/components/app/variant-sale-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import { useAuth } from "@/hooks/use-auth";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useDebounce } from "@/hooks/use-debounce";
import type { ClientOptionDto } from "@/interfaces/client.interface";
import type {
  OrderDetailDto,
  QuickSaleDto,
  QuickSalePreviewDto,
} from "@/interfaces/quick-sale.interface";
import type { VariantSaleOptionDto } from "@/interfaces/sale-option.interface";
import { clientService } from "@/services/client.service";
import { quickSaleService } from "@/services/quick-sale.service";
import {
  PAYMENT_METHOD_LABELS,
  TPaymentMethod,
  type TSaleUnit,
} from "@/types/enums";
import { formatCurrency, formatNumber } from "@/utils/format.helpers";
import { PAYMENT_ICONS, PAYMENT_SHORT_LABELS } from "@/utils/payment.helpers";
import { SALE_UNIT_SHORT } from "@/utils/product.helpers";

type ClientOption = Record<string, unknown> & ClientOptionDto;

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
 * Preço que mudou desde a busca aparece na linha (a prévia já usa o atual) e a API pede confirmação ao concluir.
 */
export default function QuickSalePage() {
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const [loadedPreview, setPreview] = useState<QuickSalePreviewDto | null>(
    null
  );
  const [done, setDone] = useState<OrderDetailDto | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);
  // Detalhe da venda recém-concluída (o mesmo do histórico).
  const [showDone, setShowDone] = useState(false);
  const pickerRef = useRef<VariantSalePickerHandle>(null);
  // Leitura feita na tela de "venda concluída": abre a nova venda e entra nela assim que o seletor existir.
  const queuedScan = useRef<string | null>(null);
  // O foco volta para a busca depois de cada ação, para o leitor e a digitação caírem nela.
  const focusSearch = useCallback(() => {
    requestAnimationFrame(() => pickerRef.current?.focus());
  }, []);
  // Cliente recém-cadastrado entra como opção do combo, para o rótulo aparecer sem nova busca.
  const [createdClients, setCreatedClients] = useState<ClientOption[]>([]);
  const searchClients = useCallback(
    (search: string) =>
      clientService.clientOptions(search, token ?? undefined) as Promise<
        ClientOption[]
      >,
    [token]
  );

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

  // − e + na quantidade: passo de 1, sem descer abaixo de 1 (para tirar o item, a lixeira).
  const stepQuantity = (index: number, delta: number) => {
    const line = form.getValues(`items.${index}`);
    const next = Math.max(1, toNumber(line.quantity) + delta);
    form.setValue(
      `items.${index}.quantity`,
      formatNumber(next, line.decimalPlaces).replace(/\./g, "")
    );
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

  const newSale = () => {
    form.reset(EMPTY_FORM);
    autoAmount.current = null;
    setPreview(null);
    setDone(null);
    setShowDone(false);
    focusSearch();
  };

  // Leitor com o foco fora da busca (num botão, na página): a leitura vai para o seletor como se fosse bipada nele.
  useBarcodeScanner(
    (code) => {
      if (done) {
        queuedScan.current = code;
        newSale();
        return;
      }
      pickerRef.current?.scan(code);
    },
    { enabled: !newClientOpen && !confirmWarning.open && !showDone }
  );

  useEffect(() => {
    const code = queuedScan.current;
    if (done || !code || !pickerRef.current) return;
    queuedScan.current = null;
    pickerRef.current.scan(code);
  }, [done]);

  // A busca já abre focada.
  useEffect(() => {
    focusSearch();
  }, [focusSearch]);

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
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={newSale} autoFocus>
            <Plus />
            Nova venda
          </Button>
          <Button variant="outline" onClick={() => setShowDone(true)}>
            <Eye />
            Ver venda
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Bipe o próximo produto para começar outra venda.
        </p>
        <SaleDetailDialog
          sale={showDone ? done : null}
          onClose={() => setShowDone(false)}
        />
      </div>
    );
  }

  const { isSubmitting } = form.formState;

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Venda rápida</h1>
          <p className="text-sm text-muted-foreground">
            Bipe o código de barras ou busque pelo nome. O preço e os totais vêm
            do sistema.
          </p>
        </div>

        {!storeId && (
          <Alert>
            <AlertTitle>Selecione uma loja</AlertTitle>
            <AlertDescription>
              A venda nasce na loja escolhida no topo e baixa do local de venda
              padrão dela.
            </AlertDescription>
          </Alert>
        )}

        <VariantSalePicker
          ref={pickerRef}
          onSelect={addOption}
          disabled={isSubmitting}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Carrinho</CardTitle>
            {items.fields.length > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {items.fields.length}{" "}
                {items.fields.length === 1 ? "item" : "itens"}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex flex-col">
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
                  <div key={line.id} className="flex flex-col gap-3">
                    {index > 0 && <Separator />}
                    <div className="grid gap-3 py-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium">
                          {line.productName}
                          {line.variantLabel && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {line.variantLabel}
                            </span>
                          )}
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {line.sku}
                          {priced && (
                            <span>
                              {formatCurrency(priced.unitPrice)} /{" "}
                              {SALE_UNIT_SHORT[line.saleUnit]}
                            </span>
                          )}
                          {priced?.promotion && (
                            <Badge
                              variant="destructive"
                              className="font-normal"
                            >
                              −{priced.promotion.discountPercent}% promoção
                            </Badge>
                          )}
                        </span>
                        {priced &&
                          priced.unitPrice !== line.expectedUnitPrice && (
                            <span className="text-xs text-warning">
                              Preço mudou desde a busca (era{" "}
                              {formatCurrency(line.expectedUnitPrice)}); você
                              confirma ao concluir.
                            </span>
                          )}
                      </div>

                      <div className="flex items-end gap-2">
                        <Controller
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid}
                              className="w-auto"
                            >
                              <FieldLabel
                                htmlFor={`qty-${line.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Quantidade
                              </FieldLabel>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label="Diminuir quantidade"
                                  disabled={toNumber(field.value) <= 1}
                                  onClick={() => {
                                    stepQuantity(index, -1);
                                    focusSearch();
                                  }}
                                >
                                  <Minus />
                                </Button>
                                <Input
                                  {...field}
                                  id={`qty-${line.id}`}
                                  inputMode="decimal"
                                  className="w-16 text-center tabular-nums"
                                  aria-invalid={fieldState.invalid}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label="Aumentar quantidade"
                                  onClick={() => {
                                    stepQuantity(index, 1);
                                    focusSearch();
                                  }}
                                >
                                  <Plus />
                                </Button>
                              </div>
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
                            <Field
                              data-invalid={fieldState.invalid}
                              className="w-28"
                            >
                              <FieldLabel
                                htmlFor={`disc-${line.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Desconto
                              </FieldLabel>
                              <InputGroup>
                                <InputGroupAddon>R$</InputGroupAddon>
                                <InputGroupInput
                                  {...field}
                                  id={`disc-${line.id}`}
                                  inputMode="decimal"
                                  className="tabular-nums"
                                  aria-invalid={fieldState.invalid}
                                />
                              </InputGroup>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-xs text-muted-foreground">
                            Total
                          </span>
                          <span className="font-semibold tabular-nums">
                            {priced ? formatCurrency(priced.lineTotal) : "—"}
                          </span>
                          {priced && priced.discount > 0 && (
                            <span className="text-xs text-destructive tabular-nums">
                              − {formatCurrency(priced.discount)}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover item"
                          onClick={() => {
                            items.remove(index);
                            focusSearch();
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
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
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="clientId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <SearchSelect<ClientOption>
                    field={{
                      value: field.value,
                      onChange: (value) =>
                        field.onChange(value ? String(value) : ""),
                    }}
                    data={createdClients}
                    onSearch={searchClients}
                    getOptionLabel={(client) => client.label}
                    getOptionValue={(client) => client.id}
                    placeholder="Consumidor final (opcional)"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => setNewClientOpen(true)}
                    disabled={isSubmitting}
                  >
                    <UserPlus />
                    Cadastrar cliente
                  </Button>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Pagamento</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addPayment}
            >
              <Plus />
              Dividir
            </Button>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {payments.fields.map((payment, index) => (
                <div key={payment.id} className="flex flex-col gap-2">
                  {index > 0 && <Separator />}
                  <Controller
                    control={form.control}
                    name={`payments.${index}.method`}
                    render={({ field }) => (
                      <div
                        role="radiogroup"
                        aria-label="Forma de pagamento"
                        className="grid grid-cols-3 gap-2"
                      >
                        {Object.values(TPaymentMethod).map((method) => {
                          const Icon = PAYMENT_ICONS[method];
                          const selected = field.value === method;
                          return (
                            <Button
                              key={method}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              variant={selected ? "default" : "outline"}
                              title={PAYMENT_METHOD_LABELS[method]}
                              className="h-auto min-w-0 flex-col gap-1 px-2 py-2 text-xs"
                              onClick={() => {
                                field.onChange(method);
                                focusSearch();
                              }}
                            >
                              <Icon />
                              <span className="truncate">
                                {PAYMENT_SHORT_LABELS[method]}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  />
                  <div className="flex items-end gap-2">
                    <Controller
                      control={form.control}
                      name={`payments.${index}.amount`}
                      render={({ field, fieldState }) => (
                        <Field
                          className="flex-1"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldLabel
                            htmlFor={`pay-${payment.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Valor
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>R$</InputGroupAddon>
                            <InputGroupInput
                              {...field}
                              id={`pay-${payment.id}`}
                              inputMode="decimal"
                              className="tabular-nums"
                              aria-invalid={fieldState.invalid}
                            />
                          </InputGroup>
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
                </div>
              ))}
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
                        Recebido em dinheiro
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>R$</InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          id="cash-received"
                          inputMode="decimal"
                          className="tabular-nums"
                          placeholder="Para calcular o troco"
                          aria-invalid={fieldState.invalid}
                        />
                      </InputGroup>
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

        <SaleSummary
          preview={preview}
          showPaid={payments.fields.length > 1}
          canSubmit={!isSubmitting && !!storeId && items.fields.length > 0}
          isSubmitting={isSubmitting}
        />
      </aside>

      <ConfirmWarningDialog state={confirmWarning} />
      <ClientQuickCreateDialog
        open={newClientOpen}
        onOpenChange={(open) => {
          setNewClientOpen(open);
          if (!open) focusSearch();
        }}
        onCreated={(client) => {
          setCreatedClients([client as ClientOption]);
          form.setValue("clientId", client.id);
        }}
      />
    </form>
  );
}

/**
 * Resumo da venda, no painel da direita: subtotal, descontos (vermelho), o total em destaque na cor da marca e a
 * situação do pagamento (falta pagar, troco ou completo). Tudo vem da prévia da API.
 */
function SaleSummary({
  preview,
  showPaid,
  canSubmit,
  isSubmitting,
}: {
  preview: QuickSalePreviewDto | null;
  showPaid: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
}) {
  const hasDiscount = !!preview && preview.discountTotal > 0;
  const hasChange = preview?.change != null && preview.change > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-1.5 text-sm">
          <SummaryRow label="Subtotal" value={preview?.subtotal} />
          {hasDiscount && (
            <SummaryRow
              label="Descontos"
              value={preview.discountTotal}
              negative
              className="text-destructive"
            />
          )}
          {showPaid && (
            <SummaryRow
              label="Pago"
              value={preview?.paid}
              className="text-success"
            />
          )}
        </dl>

        <Separator />

        <div className="flex items-baseline justify-between gap-4">
          <span className="font-medium">Total</span>
          <span className="text-3xl font-semibold tracking-tight text-primary tabular-nums">
            {preview == null
              ? formatCurrency(0)
              : formatCurrency(preview.total)}
          </span>
        </div>

        {preview != null &&
          (preview.remaining > 0 ? (
            <div className="flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>Falta pagar</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(preview.remaining)}
              </span>
            </div>
          ) : hasChange ? (
            <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
              <span>Troco</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(preview.change!)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" />
              Pagamento completo
            </div>
          ))}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSubmit}
        >
          {isSubmitting && <Spinner />}
          Concluir venda
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  negative,
  className,
}: {
  label: string;
  value: number | undefined;
  negative?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <dt className={className ? undefined : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className="tabular-nums">
        {value == null
          ? "—"
          : `${negative ? "− " : ""}${formatCurrency(value)}`}
      </dd>
    </div>
  );
}
