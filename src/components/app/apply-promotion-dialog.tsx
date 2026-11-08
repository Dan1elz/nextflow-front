import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Percent, TriangleAlert } from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { DatePicker } from "@/components/app/date-picker";
import { FormInputField } from "@/components/app/form-input-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useApiForm } from "@/hooks/use-api-form";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import type { IForecastRecommendationListItem } from "@/interfaces/forecast.interface";
import type { PromotionPreviewDto } from "@/interfaces/promotion.interface";
import {
  ALL_VARIANTS,
  applyPromotionSchema,
  SELECTED_VARIANTS,
  type ApplyPromotionFormData,
} from "@/schemas/forecast-actions.schema";
import { forecastRunService } from "@/services/forecast-run.service";
import { promotionService } from "@/services/promotion.service";
import {
  addDaysToDateOnly,
  getTodayDateOnly,
  parseDateOnly,
} from "@/utils/date.helpers";
import { formatCurrency, formatPercentage } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

const DEFAULT_DISCOUNT = 10;
const DEFAULT_DAYS = 14;

const parsePercent = (value: string) => Number(value.replace(",", "."));
const formatPercentInput = (value: string) =>
  value.replace(/[^\d,]/g, "").replace(/,(?=.*,)/g, "");

type ApplyPromotionDialogProps = {
  /** Recomendação Promover pendente; `null` fecha o dialog. */
  recommendation: IForecastRecommendationListItem | null;
  onOpenChange: (open: boolean) => void;
  onDone?: (updated: IForecastRecommendationListItem) => void;
};

function PromotionForm({
  recommendation,
  onClose,
  onDone,
}: {
  recommendation: IForecastRecommendationListItem;
  onClose: () => void;
  onDone?: (updated: IForecastRecommendationListItem) => void;
}) {
  const { token } = useAuth();
  const auth = token ?? undefined;
  const today = getTodayDateOnly();
  const form = useForm<ApplyPromotionFormData>({
    resolver: zodResolver(applyPromotionSchema),
    defaultValues: {
      discountPercent: String(
        recommendation.suggestedDiscountPercent ?? DEFAULT_DISCOUNT
      ).replace(".", ","),
      startDate: today,
      // período inclusivo: "N dias" = início + (N − 1), como o back conta
      endDate: addDaysToDateOnly(
        today,
        (recommendation.suggestedPromotionDays ?? DEFAULT_DAYS) - 1
      ),
      scope: ALL_VARIANTS,
      variantIds: [],
    },
  });
  const { submit, handleSubmit, confirmWarning } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const [discount, startDate, scope, variantIds] = useWatch({
    control: form.control,
    name: ["discountPercent", "startDate", "scope", "variantIds"],
  });

  // Prévia por variação (preço de tabela, promocional, custo médio e margem) vinda da API.
  const percent = parsePercent(useDebounce(discount, 400) ?? "");
  const canPreview = percent >= 1 && percent <= 90;
  const [loaded, setLoaded] = useState<{
    percent: number;
    preview: PromotionPreviewDto | null;
  } | null>(null);

  useEffect(() => {
    if (!canPreview) return;
    let ignore = false;
    promotionService
      .preview(recommendation.productId, null, percent, auth)
      .then((preview) => !ignore && setLoaded({ percent, preview }))
      .catch((error) => {
        if (ignore) return;
        setLoaded({ percent, preview: null });
        handleError(error, "Erro ao montar a prévia");
      });
    return () => {
      ignore = true;
    };
  }, [auth, canPreview, percent, recommendation.productId]);

  const preview =
    canPreview && loaded?.percent === percent ? loaded.preview : null;
  const previewing = canPreview && loaded?.percent !== percent;
  const variants = preview?.variants ?? [];
  const rows =
    scope === SELECTED_VARIANTS
      ? variants.filter((row) => variantIds.includes(row.variantId))
      : variants;
  const hasBelowCost = rows.some((row) => row.belowCost);
  const maxDate = parseDateOnly(addDaysToDateOnly(today, 365));

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        let result: IForecastRecommendationListItem | null = null;
        const ok = await submit(async (confirmWarnings) => {
          result = (
            await forecastRunService.applyPromotion(
              recommendation.id,
              {
                discountPercent: parsePercent(data.discountPercent),
                startDate: data.startDate,
                endDate: data.endDate,
                variantIds:
                  data.scope === SELECTED_VARIANTS ? data.variantIds : null,
                confirmWarnings,
              },
              auth
            )
          ).recommendation;
        });
        if (!ok || !result) return;
        handleSuccess("Promoção criada pela recomendação.");
        onDone?.(result);
        onClose();
      })}
      className="flex flex-col gap-6"
    >
      <DialogHeader className="text-left">
        <DialogTitle>Aplicar promoção</DialogTitle>
        <DialogDescription>
          {recommendation.productName}. A recomendação vira Aplicada com o link
          da promoção.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
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
                  maxDate={maxDate}
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
                <FieldLabel>Término</FieldLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  minDate={parseDateOnly(startDate || today)}
                  maxDate={maxDate}
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
          name="scope"
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant="label">Escopo</FieldLegend>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <Field orientation="horizontal">
                  <RadioGroupItem id="promo-scope-all" value={ALL_VARIANTS} />
                  <FieldLabel htmlFor="promo-scope-all" className="font-normal">
                    Todas as variações
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem
                    id="promo-scope-selected"
                    value={SELECTED_VARIANTS}
                    disabled={variants.length < 2}
                  />
                  <FieldLabel
                    htmlFor="promo-scope-selected"
                    className="font-normal"
                  >
                    Variações escolhidas
                  </FieldLabel>
                </Field>
              </RadioGroup>
            </FieldSet>
          )}
        />

        {scope === SELECTED_VARIANTS && (
          <Controller
            control={form.control}
            name="variantIds"
            render={({ field, fieldState }) => (
              <FieldSet data-invalid={fieldState.invalid}>
                <FieldLegend variant="label">Variações</FieldLegend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {variants.map((row) => {
                    const id = `promo-variant-${row.variantId}`;
                    return (
                      <Field key={row.variantId} orientation="horizontal">
                        <Checkbox
                          id={id}
                          checked={field.value.includes(row.variantId)}
                          disabled={isSubmitting}
                          aria-invalid={fieldState.invalid}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, row.variantId]
                                : field.value.filter((v) => v !== row.variantId)
                            )
                          }
                        />
                        <FieldLabel htmlFor={id} className="font-normal">
                          {row.variantLabel ?? "Padrão"}
                        </FieldLabel>
                      </Field>
                    );
                  })}
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldSet>
            )}
          />
        )}

        {previewing && !preview && <Skeleton className="h-24 w-full" />}
        {preview && (
          <div className="flex flex-col gap-3">
            {hasBelowCost && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Preço abaixo do custo médio</AlertTitle>
                <AlertDescription>
                  Ao aplicar, o sistema vai pedir confirmação.
                </AlertDescription>
              </Alert>
            )}
            <Table aria-label="Prévia por variação">
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
                {rows.map((row) => (
                  <TableRow key={row.variantId}>
                    <TableCell>{row.variantLabel ?? "Padrão"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.listPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.promoPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.averageCost != null
                        ? formatCurrency(row.averageCost)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="flex items-center justify-end gap-2">
                        {row.marginPercent != null
                          ? formatPercentage(row.marginPercent)
                          : "-"}
                        {row.belowCost && (
                          <Badge variant="destructive">Abaixo do custo</Badge>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </FieldGroup>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Aplicar promoção
        </Button>
      </DialogFooter>
      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}

/** Promover (T-DF6, Admin) → `POST /forecasts/recommendations/{id}/promotion`; abaixo do custo pede confirmação. */
export function ApplyPromotionDialog({
  recommendation,
  onOpenChange,
  onDone,
}: ApplyPromotionDialogProps) {
  return (
    <Dialog open={recommendation !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {recommendation && (
          <PromotionForm
            key={recommendation.id}
            recommendation={recommendation}
            onClose={() => onOpenChange(false)}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
