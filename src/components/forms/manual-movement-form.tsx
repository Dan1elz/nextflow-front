import { useEffect, useState } from "react";
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
import type {
  LotOptionDto,
  ManualMovementDto,
} from "@/interfaces/manual-movement.interface";
import type { StockMatrixDto } from "@/interfaces/product.interface";
import {
  MANUAL_REASONS,
  NEW_LOT,
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
import { formatDateOnly, formatNumber } from "@/utils/format.helpers";

interface SelectOption {
  value: string;
  label: string;
}

interface ManualMovementFormProps {
  matrix: StockMatrixDto;
  decimalPlaces: number;
  /** F1.7: o produto controla lote; a entrada pede o lote (existente ou novo) e a saída deixa escolher ou baixar por FEFO. */
  tracksLots: boolean;
  loadLotOptions: (
    variantId: string,
    locationId: string
  ) => Promise<LotOptionDto[]>;
  onSubmit: (dto: ManualMovementDto) => Promise<void>;
  onCancel: () => void;
}

/** Sem escolha de lote na saída: a API baixa pelo lote que vence primeiro (FEFO, RN-CE15). */
const AUTO_LOT = "__auto";

const reasonOptions: SelectOption[] = MANUAL_REASONS.map((reason) => ({
  value: reason,
  label: MOVEMENT_REASON_LABELS[reason],
}));

const typeOptions: SelectOption[] = Object.values(TMovementType).map(
  (type) => ({ value: type, label: MOVEMENT_TYPE_LABELS[type] })
);

function toRequest(
  data: ManualMovementFormData,
  tracksLots: boolean
): ManualMovementDto {
  const isOpening = data.reason === TMovementReason.Opening;
  const isNewLot = tracksLots && data.lotId === NEW_LOT;
  const isChosenLot =
    tracksLots &&
    !!data.lotId &&
    data.lotId !== NEW_LOT &&
    data.lotId !== AUTO_LOT;
  return {
    variantId: data.variantId,
    locationId: data.locationId,
    lotId: isChosenLot ? data.lotId : null,
    newLot: isNewLot
      ? { code: data.newLot.code.trim(), expiresOn: data.newLot.expiresOn }
      : null,
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
  tracksLots,
  loadLotOptions,
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
      lotId: AUTO_LOT,
      newLot: { code: "", expiresOn: "" },
      note: "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const [variantId, locationId, reason, type, lotId] = useWatch({
    control: form.control,
    name: ["variantId", "locationId", "reason", "type", "lotId"],
  });
  // Lotes da variação no local; guardados com a chave de onde vieram, para não mostrar os de outra variação ou local.
  const lotKey =
    tracksLots && variantId && locationId ? `${variantId}|${locationId}` : null;
  const [loadedLots, setLoadedLots] = useState<{
    key: string;
    options: LotOptionDto[];
  } | null>(null);
  const lotOptions =
    lotKey && loadedLots?.key === lotKey ? loadedLots.options : [];

  useEffect(() => {
    if (!lotKey) return;
    let active = true;
    loadLotOptions(variantId, locationId)
      .then((options) => {
        if (active) setLoadedLots({ key: lotKey, options });
      })
      .catch(() => {
        if (active) setLoadedLots({ key: lotKey, options: [] });
      });
    return () => {
      active = false;
    };
  }, [lotKey, variantId, locationId, loadLotOptions]);

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
  const isInbound = (fixedType ?? type) === TMovementType.In;

  // Entrada: um lote existente da variação ou um lote novo. Saída: um lote com saldo ou o automático (FEFO).
  const lotSelectOptions: SelectOption[] = isInbound
    ? [
        { value: NEW_LOT, label: "Novo lote" },
        ...lotOptions.map((lot) => ({
          value: lot.id,
          label: `${lot.code} · vence ${formatDateOnly(lot.expiresOn)} · saldo ${formatNumber(lot.quantity, decimalPlaces)}`,
        })),
      ]
    : [
        { value: AUTO_LOT, label: "Automático (o que vence primeiro)" },
        ...lotOptions
          .filter((lot) => lot.quantity > 0)
          .map((lot) => ({
            value: lot.id,
            label: `${lot.code} · vence ${formatDateOnly(lot.expiresOn)} · saldo ${formatNumber(lot.quantity, decimalPlaces)}`,
          })),
      ];

  /** O que o schema não sabe: com lote, a entrada exige o lote (e o lote novo, código e validade). */
  const checkLot = (data: ManualMovementFormData) => {
    if (!tracksLots) return true;
    let valid = true;
    if (isInbound && (!data.lotId || data.lotId === AUTO_LOT)) {
      form.setError("lotId", { message: "Escolha o lote ou crie um novo." });
      valid = false;
    }
    if (isInbound && data.lotId === NEW_LOT) {
      if (!data.newLot.code.trim()) {
        form.setError("newLot.code", { message: "Informe o código do lote." });
        valid = false;
      }
      if (!data.newLot.expiresOn) {
        form.setError("newLot.expiresOn", {
          message: "Informe a validade do lote.",
        });
        valid = false;
      }
    }
    return valid;
  };

  const changeReason = (value: string) => {
    form.setValue("reason", value as TManualReason, { shouldValidate: false });
    const nextType = REASON_TYPE[value as TManualReason];
    if (nextType) form.setValue("type", nextType);
    if (value !== TMovementReason.Opening) form.setValue("unitCost", "");
    // Trocar o sentido muda a lista de lotes: a escolha anterior pode não valer mais.
    form.setValue(
      "lotId",
      (nextType ?? form.getValues("type")) === TMovementType.In ? "" : AUTO_LOT
    );
    form.clearErrors(["reason", "type", "unitCost", "note", "lotId"]);
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
        if (!checkLot(data)) return;
        await submit(() => onSubmit(toRequest(data, tracksLots)));
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
          renderSelect("type", "Tipo", typeOptions, (value) => {
            form.setValue("type", value as TMovementType);
            form.setValue("lotId", value === TMovementType.In ? "" : AUTO_LOT);
            form.clearErrors(["type", "lotId"]);
          })
        )}
        {tracksLots && renderSelect("lotId", "Lote", lotSelectOptions)}
        {tracksLots && isInbound && lotId === NEW_LOT && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInputField
              control={form.control}
              name="newLot.code"
              label="Código do lote"
              icon={Hash}
              maxLength={40}
              disabled={isSubmitting}
            />
            <FormInputField
              control={form.control}
              name="newLot.expiresOn"
              label="Validade"
              type="date"
              disabled={isSubmitting}
            />
          </div>
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
