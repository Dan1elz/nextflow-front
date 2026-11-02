import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, Wallet } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import type { ManualMovementDto } from "@/interfaces/manual-movement.interface";
import type { StockMatrixDto } from "@/interfaces/product.interface";
import {
  MANUAL_REASONS,
  REASON_TYPE,
  manualMovementSchema,
  type ManualMovementFormData,
  type TManualReason,
} from "@/schemas/manual-movement.schema";
import { parsePrice } from "@/schemas/product.schema";
import {
  MOVEMENT_REASON_LABELS,
  MOVEMENT_TYPE_LABELS,
  TMovementReason,
  TMovementType,
} from "@/types/enums";
import { formatNumber } from "@/utils/format.helpers";

interface SelectOption {
  value: string;
  label: string;
}

interface ManualMovementFormProps {
  matrix: StockMatrixDto;
  decimalPlaces: number;
  onSubmit: (dto: ManualMovementDto) => Promise<void>;
  onCancel: () => void;
}

const reasonOptions: SelectOption[] = MANUAL_REASONS.map((reason) => ({
  value: reason,
  label: MOVEMENT_REASON_LABELS[reason],
}));

const typeOptions: SelectOption[] = Object.values(TMovementType).map(
  (type) => ({ value: type, label: MOVEMENT_TYPE_LABELS[type] })
);

function toRequest(data: ManualMovementFormData): ManualMovementDto {
  const isOpening = data.reason === TMovementReason.Opening;
  return {
    variantId: data.variantId,
    locationId: data.locationId,
    type: data.type,
    reason: data.reason,
    quantity: parsePrice(data.quantity),
    unitCost:
      isOpening && data.unitCost.trim() ? parsePrice(data.unitCost) : null,
    note: data.note.trim() || null,
  };
}

/** T9: ajuste, perda ou saldo de abertura de uma variação num local, com o saldo atual à vista antes de confirmar. */
export function ManualMovementForm({
  matrix,
  decimalPlaces,
  onSubmit,
  onCancel,
}: ManualMovementFormProps) {
  const form = useForm<ManualMovementFormData>({
    resolver: zodResolver(manualMovementSchema),
    defaultValues: {
      variantId: matrix.rows.length === 1 ? matrix.rows[0].variantId : "",
      locationId: matrix.locations.length === 1 ? matrix.locations[0].id : "",
      reason: TMovementReason.Adjustment,
      type: TMovementType.Out,
      quantity: "",
      unitCost: "",
      note: "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const [variantId, locationId, reason] = useWatch({
    control: form.control,
    name: ["variantId", "locationId", "reason"],
  });

  const showStore =
    new Set(matrix.locations.map((location) => location.storeName)).size > 1;
  const variantOptions: SelectOption[] = matrix.rows.map((row) => ({
    value: row.variantId,
    label: `${row.variantLabel || "Padrão"} · ${row.sku}`,
  }));
  const locationOptions: SelectOption[] = matrix.locations.map((location) => ({
    value: location.id,
    label: showStore
      ? `${location.storeName} · ${location.name}`
      : location.name,
  }));

  const currentBalance = matrix.rows
    .find((row) => row.variantId === variantId)
    ?.cells.find((cell) => cell.locationId === locationId)?.physical;
  const fixedType = REASON_TYPE[reason as TManualReason];
  const isOpening = reason === TMovementReason.Opening;
  const isAdjustment = reason === TMovementReason.Adjustment;

  const changeReason = (value: string) => {
    form.setValue("reason", value as TManualReason, { shouldValidate: false });
    const type = REASON_TYPE[value as TManualReason];
    if (type) form.setValue("type", type);
    if (value !== TMovementReason.Opening) form.setValue("unitCost", "");
    form.clearErrors(["reason", "type", "unitCost", "note"]);
  };

  const renderSelect = (
    name: FieldPath<ManualMovementFormData>,
    label: string,
    options: SelectOption[],
    onValueChange?: (value: string) => void
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            value={String(field.value ?? "")}
            onValueChange={onValueChange ?? field.onChange}
            disabled={isSubmitting}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(() => onSubmit(toRequest(data)));
      })}
    >
      <FieldGroup>
        {renderSelect("variantId", "Variação", variantOptions)}
        {renderSelect("locationId", "Local", locationOptions)}
        {currentBalance !== undefined && (
          <Alert>
            <AlertDescription>
              Saldo atual neste local:{" "}
              {formatNumber(currentBalance, decimalPlaces)}
            </AlertDescription>
          </Alert>
        )}
        {renderSelect("reason", "Motivo", reasonOptions, changeReason)}
        {fixedType ? (
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <FieldDescription>
              {MOVEMENT_TYPE_LABELS[fixedType]}, definido pelo motivo.
            </FieldDescription>
          </Field>
        ) : (
          renderSelect("type", "Tipo", typeOptions)
        )}
        <FormInputField
          control={form.control}
          name="quantity"
          label="Quantidade"
          icon={Hash}
          inputMode="decimal"
          placeholder="Ex.: 3"
          disabled={isSubmitting}
        />
        {isOpening && (
          <FormInputField
            control={form.control}
            name="unitCost"
            label="Custo unitário"
            icon={Wallet}
            inputMode="decimal"
            placeholder="Opcional"
            description="Entra no custo médio da variação."
            disabled={isSubmitting}
          />
        )}
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="note">
                {isAdjustment ? "Observação" : "Observação (opcional)"}
              </FieldLabel>
              <Textarea
                id="note"
                {...field}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Lançar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
