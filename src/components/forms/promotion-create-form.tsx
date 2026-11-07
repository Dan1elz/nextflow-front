import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Percent, TriangleAlert } from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { DatePicker } from "@/components/app/date-picker";
import { FormInputField } from "@/components/app/form-input-field";
import { SearchSelect } from "@/components/app/search-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import { useDebounce } from "@/hooks/use-debounce";
import { usePromotions } from "@/hooks/use-promotions";
import type { IOption } from "@/interfaces/api.interface";
import type {
  PromotionPreviewDto,
  PromotionRequestDto,
} from "@/interfaces/promotion.interface";
import {
  ALL_VARIANTS,
  parsePercent,
  promotionCreateSchema,
  type PromotionCreateFormData,
} from "@/schemas/promotion-create.schema";
import {
  addDaysToDateOnly,
  getTodayDateOnly,
  parseDateOnly,
} from "@/utils/date.helpers";
import { formatCurrency, formatPercentage } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

const formatPercentInput = (value: string) =>
  value.replace(/[^\d,]/g, "").replace(/,(?=.*,)/g, "");

interface PromotionCreateFormProps {
  /** Produto já escolhido (aba Promoções do T3): o combo de produto some. */
  fixedProduct?: { id: string; name: string } | null;
  onSubmit: (dto: PromotionRequestDto) => Promise<void>;
  onCancel: () => void;
}

/**
 * Nova promoção (T-VD7): produto, escopo, desconto, período e motivo, com prévia por variação vinda da API (preço
 * promocional, custo médio e margem). Abaixo do custo, a API pede confirmação e o formulário reenvia (RN-VD13).
 */
export function PromotionCreateForm({
  fixedProduct,
  onSubmit,
  onCancel,
}: PromotionCreateFormProps) {
  const { previewPromotion, searchProductOptions, getVariantOptions } =
    usePromotions();
  const today = getTodayDateOnly();
  const form = useForm<PromotionCreateFormData>({
    resolver: zodResolver(promotionCreateSchema),
    defaultValues: {
      productId: fixedProduct?.id ?? "",
      variantId: ALL_VARIANTS,
      discountPercent: "",
      startDate: today,
      endDate: addDaysToDateOnly(today, 6),
      reason: "",
    },
  });
  const { submit, confirmWarning } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const [productId, variantId, discount, startDate] = useWatch({
    control: form.control,
    name: ["productId", "variantId", "discountPercent", "startDate"],
  });
  const debouncedDiscount = useDebounce(discount, 400);
  // Cada resposta guarda a chave que a pediu: troca de produto ou de desconto descarta o resultado anterior.
  const [loadedVariants, setLoadedVariants] = useState<{
    productId: string;
    options: IOption[];
  } | null>(null);
  const [loadedPreview, setLoadedPreview] = useState<{
    key: string;
    result: PromotionPreviewDto | null;
  } | null>(null);

  useEffect(() => {
    if (!productId) return;
    let ignore = false;
    getVariantOptions(productId)
      .then((options) => !ignore && setLoadedVariants({ productId, options }))
      .catch((error) => handleError(error, "Erro ao carregar as variações"));
    return () => {
      ignore = true;
    };
  }, [getVariantOptions, productId]);

  const variants =
    loadedVariants?.productId === productId ? loadedVariants.options : [];
  const percent = parsePercent(debouncedDiscount ?? "");
  const canPreview = Boolean(productId) && percent >= 1 && percent <= 90;
  const scopeVariantId = variantId === ALL_VARIANTS ? null : variantId;
  const previewKey = `${productId}|${scopeVariantId ?? ""}|${percent}`;

  useEffect(() => {
    if (!canPreview) return;
    let ignore = false;
    previewPromotion(productId, scopeVariantId, percent)
      .then(
        (result) => !ignore && setLoadedPreview({ key: previewKey, result })
      )
      .catch((error) => {
        if (ignore) return;
        setLoadedPreview({ key: previewKey, result: null });
        handleError(error, "Erro ao montar a prévia");
      });
    return () => {
      ignore = true;
    };
  }, [
    canPreview,
    percent,
    previewKey,
    previewPromotion,
    productId,
    scopeVariantId,
  ]);

  const isPreviewing = canPreview && loadedPreview?.key !== previewKey;
  const preview =
    canPreview && loadedPreview?.key === previewKey
      ? loadedPreview.result
      : null;

  const hasBelowCost = preview?.variants.some((row) => row.belowCost) ?? false;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit((confirmWarnings) =>
          onSubmit({
            productId: data.productId,
            variantId: data.variantId === ALL_VARIANTS ? null : data.variantId,
            discountPercent: parsePercent(data.discountPercent),
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason.trim() || null,
            confirmWarnings,
          })
        );
      })}
    >
      <FieldGroup>
        {fixedProduct ? (
          <Field>
            <FieldLabel>Produto</FieldLabel>
            <p className="text-sm">{fixedProduct.name}</p>
          </Field>
        ) : (
          <Controller
            control={form.control}
            name="productId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <SearchSelect<IOption>
                  field={{
                    value: field.value,
                    onChange: (value) => {
                      field.onChange(value ? String(value) : "");
                      form.setValue("variantId", ALL_VARIANTS);
                    },
                  }}
                  label="Produto"
                  data={[]}
                  onSearch={searchProductOptions}
                  placeholder="Busque por nome, SKU ou código"
                  disabled={isSubmitting}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        <Controller
          control={form.control}
          name="variantId"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              data-disabled={isSubmitting || !productId}
            >
              <FieldLabel htmlFor="variantId">Escopo</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting || !productId}
              >
                <SelectTrigger id="variantId" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL_VARIANTS}>
                      Todas as variações
                    </SelectItem>
                    {variants.length > 1 &&
                      variants.map((variant) => (
                        <SelectItem
                          key={variant.value}
                          value={variant.value ?? ""}
                        >
                          {variant.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <FormInputField
          control={form.control}
          name="discountPercent"
          label="Desconto (%)"
          icon={Percent}
          inputMode="decimal"
          description="De 1% a 90%."
          mask={formatPercentInput}
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="startDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Início</FieldLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  minDate={parseDateOnly(today)}
                  error={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="endDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Fim</FieldLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  minDate={startDate ? parseDateOnly(startDate) : undefined}
                  maxDate={
                    startDate
                      ? parseDateOnly(addDaysToDateOnly(startDate, 89))
                      : undefined
                  }
                  error={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reason">Motivo (opcional)</FieldLabel>
              <Textarea
                id="reason"
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
                placeholder="Ex.: queima de estoque perto da validade"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {isPreviewing && !preview && <Skeleton className="h-24 w-full" />}
        {preview && (
          <div className="flex flex-col gap-3">
            {hasBelowCost && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Preço abaixo do custo médio</AlertTitle>
                <AlertDescription>
                  Ao criar, o sistema vai pedir confirmação.
                </AlertDescription>
              </Alert>
            )}
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variação</TableHead>
                    <TableHead className="text-right">Tabela</TableHead>
                    <TableHead className="text-right">Promoção</TableHead>
                    <TableHead className="text-right">Custo médio</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.variants.map((row) => (
                    <TableRow key={row.variantId}>
                      <TableCell>{row.variantLabel ?? "Padrão"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.listPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.promoPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.averageCost != null
                          ? formatCurrency(row.averageCost)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {row.marginPercent != null
                            ? formatPercentage(row.marginPercent)
                            : "-"}
                          {row.belowCost && (
                            <Badge variant="destructive">Abaixo do custo</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Criar
          </Button>
        </div>
      </FieldGroup>
      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}
