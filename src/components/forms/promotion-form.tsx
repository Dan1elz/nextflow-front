import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, startOfToday } from "date-fns";
import { AlertTriangle, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ButtonLoader } from "@/components/ui/button-loader";
import { DatePicker } from "@/components/app/date-picker";
import { SearchSelect } from "@/components/app/search-select";
import type { IOption } from "@/interfaces/api.interface";
import {
  promotionSchema,
  type PromotionSchema,
} from "@/schemas/promotion.schema";
import { formatCurrency } from "@/utils/format.helpers";
import { diffDateOnlyInDays } from "@/utils/date.helpers";
import { cn } from "@/lib/utils";

export type PromotionPricePreview = {
  price: number;
  costPrice?: number | null;
};

interface PromotionFormProps {
  onSubmit: (data: PromotionSchema) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues: Partial<PromotionSchema>;
  submitLabel?: string;
  /** Exibe o seletor de produto (criação manual). */
  showProductSelect?: boolean;
  productOptions?: IOption[];
  onSearchProducts?: (
    query: string
  ) => Promise<IOption[] | void> | IOption[] | void;
  onProductChange?: (productId: string) => void;
  /** Preço/custo atuais do produto, para a prévia do preço promocional. */
  pricePreview?: PromotionPricePreview | null;
}

const MIN_MARGIN = 0.1;

export function PromotionForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
  submitLabel = "Criar promoção",
  showProductSelect = false,
  productOptions = [],
  onSearchProducts,
  onProductChange,
  pricePreview,
}: PromotionFormProps) {
  const [today] = useState(() => startOfToday());
  const [maxDate] = useState(() => addDays(startOfToday(), 365));

  const form = useForm<PromotionSchema>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      productId: "",
      discountPercent: 10,
      startDate: "",
      endDate: "",
      reason: "",
      ...defaultValues,
    },
  });

  const [discountPercent, startDate, endDate] = useWatch({
    control: form.control,
    name: ["discountPercent", "startDate", "endDate"],
  });

  const pct = Number(discountPercent);
  const hasPct = Number.isFinite(pct) && pct > 0;
  const price = pricePreview ? Number(pricePreview.price) : null;
  const cost =
    pricePreview?.costPrice !== undefined && pricePreview?.costPrice !== null
      ? Number(pricePreview.costPrice)
      : null;
  const promotionalPrice =
    price !== null && hasPct ? price * (1 - pct / 100) : null;
  const margin =
    promotionalPrice !== null && cost !== null && promotionalPrice > 0
      ? (promotionalPrice - cost) / promotionalPrice
      : null;
  const periodDays =
    startDate && endDate ? diffDateOnlyInDays(startDate, endDate) : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {showProductSelect && (
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchSelect<IOption>
                    field={{
                      value: field.value,
                      onChange: (value) => {
                        const id = value ? String(value) : "";
                        field.onChange(id);
                        onProductChange?.(id);
                      },
                    }}
                    data={productOptions}
                    onSearch={onSearchProducts}
                    placeholder="Buscar produto..."
                    label="Produto"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="discountPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desconto (%)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    step="any"
                    className="pl-9"
                    disabled={isLoading}
                    value={
                      field.value !== undefined && !Number.isNaN(field.value)
                        ? field.value
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value || undefined}
                    onChange={field.onChange}
                    disabled={isLoading}
                    minDate={today}
                    maxDate={maxDate}
                    error={!!form.formState.errors.startDate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value || undefined}
                    onChange={field.onChange}
                    disabled={isLoading}
                    minDate={today}
                    maxDate={maxDate}
                    error={!!form.formState.errors.endDate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {periodDays !== null && periodDays >= 0 && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Duração: {periodDays + 1} {periodDays + 1 === 1 ? "dia" : "dias"}{" "}
            (máx. 90).
          </p>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ex.: excesso de estoque na baixa temporada"
                  className="min-h-[70px] resize-y"
                  maxLength={255}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {price !== null && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prévia do preço
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
              <span className="text-lg font-bold">
                {promotionalPrice !== null
                  ? formatCurrency(promotionalPrice)
                  : "—"}
              </span>
              {margin !== null && (
                <span
                  className={cn(
                    "text-xs",
                    margin < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : margin < MIN_MARGIN
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  )}
                >
                  Margem estimada: {(margin * 100).toFixed(1).replace(".", ",")}
                  %
                </span>
              )}
            </div>
            {margin !== null && margin < MIN_MARGIN && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {margin < 0
                  ? "O preço promocional fica abaixo do custo do produto."
                  : "A margem fica abaixo de 10% sobre o custo."}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              O preço efetivo final é calculado pela API.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            <ButtonLoader isLoading={isLoading} loadingText="Salvando...">
              {submitLabel}
            </ButtonLoader>
          </Button>
        </div>
      </form>
    </Form>
  );
}
