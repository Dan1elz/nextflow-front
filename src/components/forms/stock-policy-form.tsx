import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, ShieldCheck } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { StockPolicyDto } from "@/interfaces/stock-policy.interface";
import {
  stockPolicySchema,
  type StockPolicyFormData,
} from "@/schemas/stock-policy.schema";
import { formatOnlyNumbers } from "@/utils/format.helpers";

interface StockPolicyFormProps {
  initialData: StockPolicyDto;
  onSubmit: (data: StockPolicyFormData) => Promise<void>;
  onCancel: () => void;
}

/** Edição de uma classe do T13: só cobertura alvo e dias de segurança; a classe em si não muda. */
export function StockPolicyForm({
  initialData,
  onSubmit,
  onCancel,
}: StockPolicyFormProps) {
  const form = useForm<StockPolicyFormData>({
    resolver: zodResolver(stockPolicySchema),
    defaultValues: {
      targetCoverageDays: String(initialData.targetCoverageDays),
      safetyDays: String(initialData.safetyDays),
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit((data) => submit(() => onSubmit(data)))}
    >
      <FieldGroup>
        <FormInputField
          control={form.control}
          name="targetCoverageDays"
          label="Cobertura alvo (dias)"
          icon={CalendarClock}
          inputMode="numeric"
          mask={formatOnlyNumbers}
          description="Quantos dias de venda o estoque deve cobrir."
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="safetyDays"
          label="Dias de segurança"
          icon={ShieldCheck}
          inputMode="numeric"
          mask={formatOnlyNumbers}
          description="Folga para atraso do fornecedor ou pico de venda."
          disabled={isSubmitting}
        />
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}
