import type { ComponentProps, ComponentType } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

type FormInputFieldProps<TValues extends FieldValues> = Omit<
  ComponentProps<typeof InputGroupInput>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur"
> & {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
  icon?: ComponentType;
  description?: string;
  /** Máscara aplicada ao que é digitado (ex.: CPF). */
  mask?: (value: string) => string;
};

/** Campo de texto de formulário: `Field` + `InputGroup` ligados ao React Hook Form, com o erro local ou da API. */
export function FormInputField<TValues extends FieldValues>({
  control,
  name,
  label,
  icon: Icon,
  description,
  mask,
  disabled,
  className,
  ...inputProps
}: FormInputFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          data-disabled={disabled}
          className={className}
        >
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <InputGroup>
            {Icon && (
              <InputGroupAddon>
                <Icon />
              </InputGroupAddon>
            )}
            <InputGroupInput
              {...inputProps}
              {...field}
              id={name}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              onChange={(event) =>
                field.onChange(
                  mask ? mask(event.target.value) : event.target.value
                )
              }
            />
          </InputGroup>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
