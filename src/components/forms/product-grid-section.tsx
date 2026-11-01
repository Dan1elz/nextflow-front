import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Sparkles, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import type { ProductFormData } from "@/schemas/product.schema";
import { generateCombinations, newTempKey } from "@/utils/product.helpers";

function AttributeRow({
  index,
  disabled,
  onRemove,
}: {
  index: number;
  disabled: boolean;
  onRemove: () => void;
}) {
  const { register, watch, setValue, getValues, formState, clearErrors } =
    useFormContext<ProductFormData>();
  const [draft, setDraft] = useState("");
  const values = watch(`attributes.${index}.values`);
  const errors = formState.errors.attributes?.[index];
  // A API pode responder no atributo (values) ou em um valor (values[0].value, values[0].id).
  const valueErrors: { message?: string }[] = Array.isArray(errors?.values)
    ? errors.values.flatMap((item) =>
        item ? [item.value, item.id].filter(Boolean) : []
      )
    : errors?.values
      ? [errors.values as { message?: string }]
      : [];

  const addValue = () => {
    const value = draft.trim();
    if (!value) return;
    const repeated = values.some(
      (item) => item.value.toLowerCase() === value.toLowerCase()
    );
    setDraft("");
    if (repeated) return;
    setValue(`attributes.${index}.values`, [
      ...values,
      { key: newTempKey(), isNew: true, value },
    ]);
    clearErrors(`attributes.${index}.values`);
  };

  // Variação que citava o valor sai junto, para não sobrar referência ao que não existe mais (L1).
  const removeValue = (key: string) => {
    setValue(
      `attributes.${index}.values`,
      values.filter((item) => item.key !== key)
    );
    setValue(
      "variants",
      getValues("variants").filter(
        (variant) => !variant.attributeValueIds.includes(key)
      )
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Field
          className="flex-1"
          data-invalid={Boolean(errors?.name)}
          data-disabled={disabled}
        >
          <FieldLabel htmlFor={`attribute-${index}`}>Atributo</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`attribute-${index}`}
              placeholder="Ex.: Tamanho"
              disabled={disabled}
              aria-invalid={Boolean(errors?.name)}
              {...register(`attributes.${index}.name`)}
            />
          </InputGroup>
          {errors?.name && <FieldError errors={[errors.name]} />}
          {errors?.id && <FieldError errors={[errors.id]} />}
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-6"
          disabled={disabled}
          onClick={onRemove}
          aria-label="Remover atributo"
        >
          <Trash2 />
        </Button>
      </div>

      <Field data-invalid={valueErrors.length > 0} data-disabled={disabled}>
        <FieldLabel htmlFor={`attribute-value-${index}`}>Valores</FieldLabel>
        <div className="flex gap-2">
          <InputGroup>
            <InputGroupInput
              id={`attribute-value-${index}`}
              value={draft}
              placeholder="Ex.: P"
              disabled={disabled}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addValue();
                }
              }}
            />
          </InputGroup>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={addValue}
          >
            <Plus data-icon="inline-start" />
            Adicionar
          </Button>
        </div>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {values.map((item) => (
              <Badge
                key={item.key}
                variant="secondary"
                className="max-w-full min-w-0 gap-1"
              >
                <span className="truncate">{item.value}</span>
                <button
                  type="button"
                  className="shrink-0"
                  disabled={disabled}
                  aria-label={`Remover ${item.value}`}
                  onClick={() => removeValue(item.key)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {valueErrors.length > 0 && <FieldError errors={valueErrors} />}
      </Field>
    </div>
  );
}

/** Seção Grade do T2: atributos, valores e o botão "gerar combinações" (RN-CE49, L1). */
export function ProductGridSection({ disabled }: { disabled: boolean }) {
  const { control, getValues, setValue, formState, clearErrors } =
    useFormContext<ProductFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
    keyName: "fieldKey",
  });
  const attributesError = formState.errors.attributes?.message;

  const generate = () => {
    setValue(
      "variants",
      generateCombinations(
        getValues("attributes"),
        getValues("variants"),
        getValues("name")
      ),
      { shouldDirty: true }
    );
    clearErrors("variants");
  };

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <AttributeRow
          key={field.fieldKey}
          index={index}
          disabled={disabled}
          onRemove={() => remove(index)}
        />
      ))}
      {attributesError && (
        <FieldError errors={[{ message: attributesError }]} />
      )}
      <FieldDescription>
        A ordem dos valores é a ordem da grade. Depois de mudar atributos, gere
        as combinações de novo: as linhas que já existem são mantidas.
      </FieldDescription>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => append({ id: null, name: "", values: [] })}
        >
          <Plus data-icon="inline-start" />
          Novo atributo
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || fields.length === 0}
          onClick={generate}
        >
          <Sparkles data-icon="inline-start" />
          Gerar combinações
        </Button>
      </div>
    </div>
  );
}
