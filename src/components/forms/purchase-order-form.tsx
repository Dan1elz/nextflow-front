import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus, Trash2 } from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { PurchaseItemPicker } from "@/components/app/purchase-item-picker";
import { SearchSelect } from "@/components/app/search-select";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { IOption } from "@/interfaces/api.interface";
import type {
  PurchaseItemSuggestionDto,
  PurchaseOrderFormDto,
  PurchaseVariantOptionDto,
  SavePurchaseOrderDto,
} from "@/interfaces/purchase-order.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import { parsePrice } from "@/schemas/product.schema";
import {
  purchaseOrderSchema,
  type PurchaseOrderFormData,
} from "@/schemas/purchase-order.schema";
import { LIFECYCLE_LABELS, SALE_UNIT_LABELS, TLifecycle } from "@/types/enums";
import {
  formatCurrency,
  formatDateOnly,
  formatNumber,
} from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

interface PurchaseOrderFormProps {
  mode: "create" | "edit";
  /** Loja selecionada no topo: define o local de entrega padrão na criação. */
  storeId: string | null;
  initialData?: PurchaseOrderFormDto | null;
  onSubmit: (dto: SavePurchaseOrderDto) => Promise<void>;
}

const toInput = (value?: number | null) =>
  value == null ? "" : String(value).replace(".", ",");

const variantName = (item: { productName: string; variantLabel: string }) =>
  item.variantLabel
    ? `${item.productName} · ${item.variantLabel}`
    : item.productName;

/** Pedido de compra (T-CP2): cabeçalho, itens por variação e aviso de confirmação (mínimo, múltiplo, fora de linha). */
export function PurchaseOrderForm({
  mode,
  storeId,
  initialData,
  onSubmit,
}: PurchaseOrderFormProps) {
  const {
    searchSupplierOptions,
    getLocationOptions,
    getDefaultReceiveLocationId,
    getItemSuggestion,
    searchVariantOptions,
  } = usePurchaseOrders();

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: initialData?.supplierId ?? "",
      receiveLocationId: initialData?.receiveLocationId ?? "",
      note: initialData?.note ?? "",
      items:
        initialData?.items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          quantity: toInput(item.quantity),
          unitCost: toInput(item.unitCost),
        })) ?? [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const { submit, confirmWarning } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const supplierId = useWatch({ control: form.control, name: "supplierId" });
  const receiveLocationId = useWatch({
    control: form.control,
    name: "receiveLocationId",
  });

  const [suggestions, setSuggestions] = useState<
    Record<string, PurchaseItemSuggestionDto>
  >(() =>
    Object.fromEntries(
      (initialData?.items ?? []).map((item) => [item.variantId, item])
    )
  );
  const [supplierOptions, setSupplierOptions] = useState<IOption[]>(
    initialData
      ? [{ value: initialData.supplierId, label: initialData.supplierName }]
      : []
  );
  const [locations, setLocations] = useState<LocationOptionDto[]>(
    initialData?.options.locations ?? []
  );
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (initialData) return;
    getLocationOptions()
      .then(setLocations)
      .catch((error) => handleError(error, "Erro ao buscar locais"));
    if (!storeId) return;
    getDefaultReceiveLocationId(storeId)
      .then((id) => {
        setDefaultLocationId(id);
        if (id && !form.getValues("receiveLocationId"))
          form.setValue("receiveLocationId", id);
      })
      .catch(() => undefined);
  }, [
    form,
    getDefaultReceiveLocationId,
    getLocationOptions,
    initialData,
    storeId,
  ]);

  // Na criação o pedido nasce na loja do topo, como a venda rápida: só os locais dela, e o local de recebimento
  // padrão fica travado. Sem padrão ativo, escolhe entre os locais da loja.
  const isCreate = mode === "create";
  const locationOptions = useMemo(
    () =>
      isCreate && storeId
        ? locations.filter((location) => location.storeId === storeId)
        : locations,
    [isCreate, locations, storeId]
  );
  const locationLocked =
    isCreate &&
    defaultLocationId !== null &&
    locationOptions.some((location) => location.id === defaultLocationId);

  const deliveryStoreId = useMemo(
    () => locations.find((l) => l.id === receiveLocationId)?.storeId ?? storeId,
    [locations, receiveLocationId, storeId]
  );

  const searchSuppliers = async (term: string) => {
    const options: IOption[] = (await searchSupplierOptions(term)).map(
      (option) => ({ ...option })
    );
    setSupplierOptions(options);
    return options;
  };

  const addVariant = async (option: PurchaseVariantOptionDto) => {
    if (
      form
        .getValues("items")
        .some((item) => item.variantId === option.variantId)
    )
      return;
    if (!deliveryStoreId) {
      handleError(new Error("Escolha o local de entrega antes dos itens."));
      return;
    }
    try {
      const suggestion = await getItemSuggestion(
        supplierId,
        option.variantId,
        deliveryStoreId
      );
      setSuggestions((current) => ({
        ...current,
        [option.variantId]: suggestion,
      }));
      append({
        id: null,
        variantId: option.variantId,
        quantity: toInput(
          suggestion.minOrderQty ?? suggestion.orderMultiple ?? null
        ),
        unitCost: toInput(
          suggestion.lastCostFromSupplier ??
            suggestion.lastCost ??
            suggestion.averageCost ??
            null
        ),
      });
      form.clearErrors("items");
    } catch (error) {
      handleError(error, "Erro ao buscar o item");
    }
  };

  const itemsError =
    form.formState.errors.items?.root?.message ??
    form.formState.errors.items?.message;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(async (confirmWarnings) =>
          onSubmit({
            supplierId: data.supplierId,
            receiveLocationId: data.receiveLocationId,
            note: data.note || null,
            version: initialData?.version ?? null,
            confirmWarnings,
            items: data.items.map((item) => ({
              id: item.id,
              variantId: item.variantId,
              quantity: parsePrice(item.quantity),
              unitCost: parsePrice(item.unitCost),
            })),
          })
        );
      })}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Itens</CardTitle>
              {fields.length > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {fields.length} {fields.length === 1 ? "item" : "itens"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <PurchaseItemPicker
              supplierId={supplierId}
              disabled={!supplierId || !receiveLocationId || isSubmitting}
              disabledHint={
                !supplierId
                  ? "Escolha o fornecedor ao lado para buscar os itens"
                  : "Escolha o local de entrega ao lado"
              }
              search={searchVariantOptions}
              onSelect={addVariant}
            />
            <div className="flex flex-col">
              {fields.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <PackagePlus />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum item</EmptyTitle>
                    <EmptyDescription>
                      {supplierId && receiveLocationId
                        ? "Busque acima ou bipe o código. A compra é sempre na unidade de venda."
                        : "Escolha o fornecedor e o local de entrega ao lado para adicionar os itens."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                fields.map((row, index) => {
                  const info = suggestions[row.variantId];
                  return (
                    <div key={row.id} className="flex flex-col gap-3">
                      {index > 0 && <Separator />}
                      <div className="grid gap-3 py-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-medium">
                            {info ? variantName(info) : row.variantId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            SKU {info?.sku}
                            {info?.supplierSku
                              ? ` · no fornecedor ${info.supplierSku}`
                              : ""}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {info?.lifecycle === TLifecycle.Discontinued && (
                              <Badge variant="destructive">
                                {LIFECYCLE_LABELS[info.lifecycle]}
                              </Badge>
                            )}
                            {info?.minOrderQty != null && (
                              <Badge variant="outline">
                                Mínimo{" "}
                                {formatNumber(
                                  info.minOrderQty,
                                  info.decimalPlaces
                                )}
                              </Badge>
                            )}
                            {info?.orderMultiple != null && (
                              <Badge variant="outline">
                                Múltiplo{" "}
                                {formatNumber(
                                  info.orderMultiple,
                                  info.decimalPlaces
                                )}
                              </Badge>
                            )}
                          </div>
                          {info && (
                            <span className="text-xs text-muted-foreground">
                              Disponível na loja{" "}
                              {formatNumber(
                                info.availableAtStore,
                                info.decimalPlaces
                              )}
                              {" · "}A caminho{" "}
                              {formatNumber(
                                info.incomingQuantity,
                                info.decimalPlaces
                              )}
                            </span>
                          )}
                          {/* 422 da API na variação (inativa, repetida): sem campo próprio, aparece na linha. */}
                          {form.formState.errors.items?.[index]?.variantId && (
                            <FieldError
                              errors={[
                                form.formState.errors.items[index].variantId,
                              ]}
                            />
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex w-28 flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              Quantidade
                              {info
                                ? ` (${SALE_UNIT_LABELS[info.saleUnit].toLowerCase()})`
                                : ""}
                            </span>
                            <ItemInput
                              form={form}
                              name={`items.${index}.quantity`}
                              label="Quantidade"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="flex w-32 flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              Custo unitário
                            </span>
                            <ItemInput
                              form={form}
                              name={`items.${index}.unitCost`}
                              label="Custo unitário"
                              disabled={isSubmitting}
                              prefix="R$"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remover item"
                            disabled={isSubmitting}
                            onClick={() => remove(index)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      {info?.averageCost != null && (
                        <span className="-mt-2 text-right text-xs text-muted-foreground">
                          Custo médio atual {formatCurrency(info.averageCost)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {itemsError && <FieldError>{itemsError}</FieldError>}
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <Card>
            <CardHeader>
              <CardTitle>Fornecedor e entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <SearchSelect<IOption>
                        field={{
                          value: field.value,
                          onChange: (value) =>
                            field.onChange(value ? String(value) : ""),
                        }}
                        label="Fornecedor"
                        data={supplierOptions}
                        onSearch={searchSuppliers}
                        placeholder="Digite para buscar"
                        disabled={isSubmitting || fields.length > 0}
                      />
                      {fields.length > 0 && (
                        <FieldDescription>
                          Remova os itens para trocar o fornecedor.
                        </FieldDescription>
                      )}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="receiveLocationId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="receiveLocationId">
                        Local de entrega
                      </FieldLabel>
                      <Select
                        value={field.value}
                        // O Radix chama com "" quando o valor chega antes das opções (local padrão antes da lista):
                        // ignorar, senão o local zera e os itens nunca liberam.
                        onValueChange={(value) =>
                          value && field.onChange(value)
                        }
                        disabled={
                          isSubmitting || fields.length > 0 || locationLocked
                        }
                      >
                        <SelectTrigger
                          id="receiveLocationId"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Escolha o local" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {locationOptions.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.storeName} › {location.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {locationLocked && (
                        <FieldDescription>
                          Local de recebimento padrão da loja selecionada no
                          topo.
                        </FieldDescription>
                      )}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="note"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="note">Observação</FieldLabel>
                      <Textarea
                        {...field}
                        id="note"
                        placeholder="Opcional: condição combinada, contato etc."
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Itens</dt>
                  <dd className="tabular-nums">{fields.length}</dd>
                </div>
                {initialData && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Prazo</dt>
                    <dd>
                      {initialData.leadTimeDays} dia(s)
                      {initialData.expectedOn
                        ? ` · ${formatDateOnly(initialData.expectedOn)}`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>
              {initialData && (
                <>
                  <Separator />
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">Total salvo</span>
                    <span className="text-2xl font-semibold text-primary tabular-nums">
                      {formatCurrency(initialData.total)}
                    </span>
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                {mode === "edit"
                  ? "O total e o prazo são recalculados pelo sistema ao salvar."
                  : "O pedido nasce como orçamento: o total e o prazo são calculados pelo sistema ao criar, e nada é enviado ao fornecedor."}
              </p>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner data-icon="inline-start" />}
                {mode === "edit" ? "Salvar" : "Criar orçamento"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}

function ItemInput({
  form,
  name,
  label,
  disabled,
  prefix,
}: {
  form: ReturnType<typeof useForm<PurchaseOrderFormData>>;
  name: `items.${number}.quantity` | `items.${number}.unitCost`;
  label: string;
  disabled: boolean;
  prefix?: string;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <InputGroup>
            {prefix && <InputGroupAddon>{prefix}</InputGroupAddon>}
            <InputGroupInput
              {...field}
              value={field.value ?? ""}
              inputMode="decimal"
              className="tabular-nums"
              aria-label={label}
              aria-invalid={fieldState.invalid}
              disabled={disabled}
            />
          </InputGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
