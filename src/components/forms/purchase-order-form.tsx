import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus, Trash2 } from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { SearchSelect } from "@/components/app/search-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import { useDebounce } from "@/hooks/use-debounce";
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

  useEffect(() => {
    if (initialData) return;
    getLocationOptions()
      .then(setLocations)
      .catch((error) => handleError(error, "Erro ao buscar locais"));
    if (!storeId) return;
    getDefaultReceiveLocationId(storeId)
      .then((id) => {
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
      <FieldGroup className="grid gap-5 md:grid-cols-2">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                onValueChange={field.onChange}
                disabled={isSubmitting || fields.length > 0}
              >
                <SelectTrigger
                  id="receiveLocationId"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Escolha o local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.storeName} › {location.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {initialData && (
                <FieldDescription>
                  Prazo de {initialData.leadTimeDays} dia(s)
                  {initialData.expectedOn
                    ? `, previsão em ${formatDateOnly(initialData.expectedOn)}`
                    : ""}
                  .
                </FieldDescription>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="md:col-span-2">
              <FieldLabel htmlFor="note">Observação</FieldLabel>
              <Textarea
                {...field}
                id="note"
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Itens</Label>
            <VariantPicker
              supplierId={supplierId}
              disabled={!supplierId || !receiveLocationId || isSubmitting}
              search={searchVariantOptions}
              onSelect={addVariant}
            />
          </div>

          {fields.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>Nenhum item</EmptyTitle>
                <EmptyDescription>
                  Escolha o fornecedor e o local de entrega e adicione as
                  variações. A compra é sempre na unidade de venda.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo unitário</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((row, index) => {
                    const info = suggestions[row.variantId];
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="min-w-56">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {info ? variantName(info) : row.variantId}
                            </span>
                            <span className="text-muted-foreground text-xs">
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
                            {/* 422 da API na variação (inativa, repetida): sem campo próprio, aparece na linha. */}
                            {form.formState.errors.items?.[index]
                              ?.variantId && (
                              <FieldError
                                errors={[
                                  form.formState.errors.items[index].variantId,
                                ]}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-32">
                          <ItemInput
                            form={form}
                            name={`items.${index}.quantity`}
                            label="Quantidade"
                            disabled={isSubmitting}
                          />
                          {info && (
                            <span className="text-muted-foreground text-xs">
                              {SALE_UNIT_LABELS[info.saleUnit]}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-32">
                          <ItemInput
                            form={form}
                            name={`items.${index}.unitCost`}
                            label="Custo unitário"
                            disabled={isSubmitting}
                          />
                          {info?.averageCost != null && (
                            <span className="text-muted-foreground text-xs">
                              Médio {formatCurrency(info.averageCost)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground min-w-36 text-xs">
                          {info && (
                            <div className="flex flex-col gap-1">
                              <span>
                                Disponível{" "}
                                {formatNumber(
                                  info.availableAtStore,
                                  info.decimalPlaces
                                )}
                              </span>
                              <span>
                                A caminho{" "}
                                {formatNumber(
                                  info.incomingQuantity,
                                  info.decimalPlaces
                                )}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {itemsError && <FieldError>{itemsError}</FieldError>}
          {initialData && (
            <p className="text-muted-foreground text-sm">
              Total salvo: {formatCurrency(initialData.total)}. O total é
              recalculado ao salvar.
            </p>
          )}
        </div>

        <div className="flex justify-end md:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {mode === "edit" ? "Salvar" : "Criar orçamento"}
          </Button>
        </div>
      </FieldGroup>
      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}

function ItemInput({
  form,
  name,
  label,
  disabled,
}: {
  form: ReturnType<typeof useForm<PurchaseOrderFormData>>;
  name: `items.${number}.quantity` | `items.${number}.unitCost`;
  label: string;
  disabled: boolean;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Input
            {...field}
            value={field.value ?? ""}
            inputMode="decimal"
            aria-label={label}
            aria-invalid={fieldState.invalid}
            disabled={disabled}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

/** Busca de variações (T-CP2): por padrão só as do fornecedor; "mostrar todos" abre o catálogo inteiro. */
function VariantPicker({
  supplierId,
  disabled,
  search,
  onSelect,
}: {
  supplierId: string;
  disabled: boolean;
  search: (
    supplierId: string,
    search: string,
    onlyLinked: boolean
  ) => Promise<PurchaseVariantOptionDto[]>;
  onSelect: (option: PurchaseVariantOptionDto) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [options, setOptions] = useState<PurchaseVariantOptionDto[]>([]);
  const debouncedTerm = useDebounce(term, 300);
  // A busca em andamento é a que ainda não respondeu: compara a chave pedida com a última respondida.
  const requestKey = `${supplierId}|${showAll}|${debouncedTerm}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = open && loadedKey !== requestKey;

  useEffect(() => {
    if (!open || !supplierId) return;
    let active = true;
    search(supplierId, debouncedTerm, !showAll)
      .then((result) => {
        if (!active) return;
        setOptions(result);
        setLoadedKey(`${supplierId}|${showAll}|${debouncedTerm}`);
      })
      .catch((error) => handleError(error, "Erro ao buscar itens"));
    return () => {
      active = false;
    };
  }, [debouncedTerm, open, search, showAll, supplierId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <PackagePlus data-icon="inline-start" />
          Adicionar item
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
        align="end"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder="Nome, SKU ou código de barras"
          />
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Switch
              id="show-all-products"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
            <Label htmlFor="show-all-products">Mostrar todos os produtos</Label>
          </div>
          <CommandList>
            {loading ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhuma variação encontrada.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.variantId}
                      value={option.variantId}
                      onSelect={async () => {
                        setOpen(false);
                        await onSelect(option);
                      }}
                    >
                      <div className="flex flex-1 flex-col">
                        <span>{variantName(option)}</span>
                        <span className="text-muted-foreground text-xs">
                          SKU {option.sku}
                        </span>
                      </div>
                      {!option.isLinked && (
                        <Badge variant="secondary">Sem vínculo</Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
