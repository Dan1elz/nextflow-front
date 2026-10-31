import { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tag } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { SearchSelect } from "@/components/app/search-select";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import { useCategories } from "@/hooks/use-categories";
import type { IOption } from "@/interfaces/api.interface";
import type { CategoryNodeDto } from "@/interfaces/category.interface";
import {
  categorySchema,
  type CategoryFormData,
} from "@/schemas/category.schema";

interface CategoryFormProps {
  initialData?: CategoryNodeDto | null;
  /** Pai já escolhido: subcategoria nova ou edição de uma filha. */
  parent?: CategoryNodeDto | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({
  initialData,
  parent,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const { searchParentOptions } = useCategories();
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      parentId: parent?.id ?? "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const hasChildren = (initialData?.children.length ?? 0) > 0;

  const parentOptions = useMemo<IOption[]>(
    () => (parent ? [{ value: parent.id, label: parent.name }] : []),
    [parent]
  );

  // A própria categoria não é pai dela; o resto do que o combo traz é só nível 1 (RN-CE23).
  const searchParents = useCallback(
    async (search: string) => {
      const options = await searchParentOptions(search);
      return options.filter((option) => option.value !== initialData?.id);
    },
    [initialData?.id, searchParentOptions]
  );

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(() => onSubmit(data));
      })}
    >
      <FieldGroup>
        <FormInputField
          control={form.control}
          name="name"
          label="Nome"
          icon={Tag}
          placeholder="Ex.: Chocolates"
          disabled={isSubmitting}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="categoryDescription">Descrição</FieldLabel>
              <Textarea
                id="categoryDescription"
                {...field}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="parentId"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              data-disabled={hasChildren}
            >
              <FieldLabel>Categoria pai</FieldLabel>
              <SearchSelect<IOption>
                field={{
                  value: field.value,
                  onChange: (value) =>
                    field.onChange(value ? String(value) : ""),
                }}
                data={parentOptions}
                onSearch={searchParents}
                placeholder="Nenhuma (nível 1)"
                disabled={isSubmitting || hasChildren}
              />
              <FieldDescription>
                {hasChildren
                  ? "Esta categoria tem subcategorias e fica no nível 1."
                  : "Só categoria de nível 1 pode ser pai."}
              </FieldDescription>
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
            {initialData ? "Salvar" : "Criar"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
