import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import { useAuth } from "@/hooks/use-auth";
import type { IForecastRecommendationListItem } from "@/interfaces/forecast.interface";
import {
  dismissSchema,
  NO_REASON,
  type DismissFormData,
} from "@/schemas/forecast-actions.schema";
import { forecastRunService } from "@/services/forecast-run.service";
import {
  DISMISS_REASON_LABELS,
  TDismissReason,
  type TDismissReason as DismissReason,
} from "@/types/enums";
import { handleSuccess } from "@/utils/toast.helpers";

type DismissRecommendationDialogProps = {
  /** Recomendação a descartar; `null` fecha o dialog. */
  recommendation: IForecastRecommendationListItem | null;
  onOpenChange: (open: boolean) => void;
  onDone?: (updated: IForecastRecommendationListItem) => void;
};

const REASONS: { value: string; label: string }[] = [
  { value: NO_REASON, label: "Sem motivo" },
  ...(Object.entries(DISMISS_REASON_LABELS) as [DismissReason, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

function DismissForm({
  recommendation,
  onClose,
  onDone,
}: {
  recommendation: IForecastRecommendationListItem;
  onClose: () => void;
  onDone?: (updated: IForecastRecommendationListItem) => void;
}) {
  const { token } = useAuth();
  const form = useForm<DismissFormData>({
    resolver: zodResolver(dismissSchema),
    defaultValues: { reasonCode: NO_REASON, note: "" },
  });
  const { submit, handleSubmit, confirmWarning } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const reasonCode = useWatch({ control: form.control, name: "reasonCode" });
  const isOther = reasonCode === TDismissReason.Other;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        let updated: IForecastRecommendationListItem | null = null;
        const ok = await submit(async () => {
          updated = await forecastRunService.dismiss(
            recommendation.id,
            {
              reasonCode: (data.reasonCode || null) as DismissReason | null,
              note: data.note.trim() || null,
            },
            token ?? undefined
          );
        });
        if (!ok || !updated) return;
        handleSuccess("Recomendação descartada.");
        onDone?.(updated);
        onClose();
      })}
      className="flex flex-col gap-6"
    >
      <DialogHeader className="text-left">
        <DialogTitle>Descartar recomendação</DialogTitle>
        <DialogDescription>
          {recommendation.productName} sai das pendentes. O motivo ajuda a
          entender onde a previsão erra.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Controller
          control={form.control}
          name="reasonCode"
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant="label">Motivo</FieldLegend>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                {REASONS.map((reason) => (
                  <Field key={reason.value || "none"} orientation="horizontal">
                    <RadioGroupItem
                      id={`dismiss-reason-${reason.value || "none"}`}
                      value={reason.value}
                    />
                    <FieldLabel
                      htmlFor={`dismiss-reason-${reason.value || "none"}`}
                      className="font-normal"
                    >
                      {reason.label}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
          )}
        />
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="dismiss-note">
                {isOther ? "Descreva o motivo" : "Descreva o motivo (opcional)"}
              </FieldLabel>
              <Textarea
                id="dismiss-note"
                {...field}
                aria-invalid={fieldState.invalid}
                maxLength={255}
                disabled={isSubmitting}
                placeholder="Ex.: já negociado com o fornecedor"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Descartar
        </Button>
      </DialogFooter>
      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}

/** Descartar (T-DF8) → `POST /forecasts/recommendations/{id}/dismiss`; "Outro" exige o texto. */
export function DismissRecommendationDialog({
  recommendation,
  onOpenChange,
  onDone,
}: DismissRecommendationDialogProps) {
  return (
    <Dialog open={recommendation !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {recommendation && (
          <DismissForm
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
