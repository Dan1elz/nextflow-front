import { useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Tag } from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { DatePicker } from "@/components/app/date-picker";
import { FormInputField } from "@/components/app/form-input-field";
import { ImagePicker } from "@/components/app/image-picker";
import { SearchSelect } from "@/components/app/search-select";
import { ProductGridSection } from "@/components/forms/product-grid-section";
import { ProductVariantsSection } from "@/components/forms/product-variants-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import type { IOption } from "@/interfaces/api.interface";
import type { ProductFormOptionsDto } from "@/interfaces/product.interface";
import { productSchema, type ProductFormData } from "@/schemas/product.schema";
import {
  PRODUCT_TYPE_LABELS,
  SALE_UNIT_LABELS,
  TProductType,
  TSaleUnit,
} from "@/types/enums";
import {
  DECIMALS_BY_UNIT,
  emptyVariant,
  generateCombinations,
  newTempKey,
} from "@/utils/product.helpers";

/** Lançamento e coleção podem ser planejados: o seletor não trava em hoje. */
const MAX_DATE = new Date(2100, 11, 31);

export type ProductImageChange = { file: File | null; touched: boolean };

interface ProductFormProps {
  initialData: ProductFormData;
  initialImageUrl?: string | null;
  options: ProductFormOptionsDto;
  isEdit: boolean;
  onSubmit: (data: ProductFormData, image: ProductImageChange) => Promise<void>;
  onCancel: () => void;
}

const SIZE_VALUES = ["P", "M", "G"];

const sizeAttribute = (): ProductFormData["attributes"][number] => ({
  id: null,
  name: "Tamanho",
  values: SIZE_VALUES.map((value) => ({
    key: newTempKey(),
    isNew: true,
    value,
  })),
});

/** T2: o tipo define os padrões e o que aparece aberto; nada é apagado ao trocá-lo na edição (RN-CE20, RN-CE55). */
export function ProductForm({
  initialData,
  initialImageUrl,
  options,
  isEdit,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });
  const { submit, confirmWarning } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const [image, setImage] = useState<string | File | null>(
    initialImageUrl ?? null
  );
  const [imageTouched, setImageTouched] = useState(false);

  const productType = useWatch({ control: form.control, name: "productType" });
  const hasGrid = useWatch({ control: form.control, name: "hasGrid" });
  const tracksLots = useWatch({ control: form.control, name: "tracksLots" });

  const turnGridOn = () => {
    form.setValue("hasGrid", true);
    if (form.getValues("attributes").length > 0) return;
    const attributes = [sizeAttribute()];
    form.setValue("attributes", attributes);
    form.setValue(
      "variants",
      generateCombinations(
        attributes,
        form.getValues("variants"),
        form.getValues("name")
      )
    );
  };

  // A primeira linha continua sendo a variação padrão: o id não se perde quando houver saldo (RN-CE51).
  const turnGridOff = () => {
    const [first] = form.getValues("variants");
    form.setValue("hasGrid", false);
    form.setValue("attributes", []);
    form.setValue("variants", [
      first
        ? { ...first, attributeValueIds: [], isActive: true }
        : emptyVariant(),
    ]);
  };

  const changeUnit = (unit: TSaleUnit) => {
    form.setValue("saleUnit", unit);
    form.setValue("decimalPlaces", DECIMALS_BY_UNIT[unit]);
  };

  const changeType = (type: TProductType) => {
    form.setValue("productType", type);
    if (isEdit) return;
    // Na criação o tipo traz os padrões do DER; o usuário pode mudar cada um depois.
    if (type === TProductType.Apparel) turnGridOn();
    else if (form.getValues("hasGrid")) turnGridOff();
    form.setValue("tracksLots", type === TProductType.Perishable);
    if (type === TProductType.Perishable) changeUnit(TSaleUnit.Kilogram);
    else if (type === TProductType.Bulk) changeUnit(TSaleUnit.Meter);
    else changeUnit(TSaleUnit.Unit);
  };

  const categoryOptions: IOption[] = options.categories.map((category) => ({
    value: category.id,
    label: category.path,
  }));
  const collectionOptions: IOption[] = options.collections.map(
    (collection) => ({
      value: collection.value,
      label: collection.label,
    })
  );

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (data) => {
          await submit(() =>
            onSubmit(data, {
              file: image instanceof File ? image : null,
              touched: imageTouched,
            })
          );
        })}
      >
        <Card>
          <CardHeader>
            <CardTitle>Básico</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="flex flex-col gap-6 md:flex-row">
                <ImagePicker
                  value={image}
                  disabled={isSubmitting}
                  onChange={(file) => {
                    setImage(file);
                    setImageTouched(true);
                  }}
                />
                <FieldGroup className="flex-1">
                  <FormInputField
                    control={form.control}
                    name="name"
                    label="Nome"
                    icon={Package}
                    placeholder="Ex.: Camiseta básica"
                    disabled={isSubmitting}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInputField
                      control={form.control}
                      name="brand"
                      label="Marca"
                      icon={Tag}
                      disabled={isSubmitting}
                    />
                    <Controller
                      control={form.control}
                      name="productType"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="productType">Tipo</FieldLabel>
                          <Select
                            value={field.value}
                            disabled={isSubmitting}
                            onValueChange={(value) =>
                              changeType(value as TProductType)
                            }
                          >
                            <SelectTrigger id="productType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {Object.values(TProductType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {PRODUCT_TYPE_LABELS[type]}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>
              </div>
              <Controller
                control={form.control}
                name="categoryIds"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Categorias</FieldLabel>
                    <SearchSelect<IOption>
                      multiple
                      placeholder="Selecione..."
                      data={categoryOptions}
                      disabled={isSubmitting}
                      field={{
                        value: field.value as unknown as string,
                        onChange: (value) =>
                          field.onChange((value as unknown as string[]) ?? []),
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="description">Descrição</FieldLabel>
                    <Textarea
                      {...field}
                      id="description"
                      rows={3}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={form.control}
                  name="saleUnit"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="saleUnit">
                        Unidade de venda
                      </FieldLabel>
                      <Select
                        value={field.value}
                        disabled={isSubmitting}
                        onValueChange={(value) =>
                          changeUnit(value as TSaleUnit)
                        }
                      >
                        <SelectTrigger id="saleUnit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(TSaleUnit).map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {SALE_UNIT_LABELS[unit]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <FormInputField
                  control={form.control}
                  name="decimalPlaces"
                  label="Casas decimais"
                  inputMode="numeric"
                  description="De 0 a 3. Preenchida pela unidade."
                  disabled={isSubmitting}
                />
              </div>
              <Controller
                control={form.control}
                name="allowsNegative"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="allowsNegative"
                      checked={field.value}
                      disabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="allowsNegative">
                        Permite estoque negativo
                      </FieldLabel>
                      <FieldDescription>
                        Por padrão, a venda não deixa o saldo negativo.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade</CardTitle>
            <CardDescription>
              {productType === TProductType.Apparel
                ? "Vestuário costuma ter tamanho e cor, cada um com estoque próprio."
                : "Opcional: use quando o produto vem em tamanhos, cores ou sabores."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <Switch
                  id="hasGrid"
                  checked={hasGrid}
                  disabled={isSubmitting}
                  onCheckedChange={(checked) =>
                    checked ? turnGridOn() : turnGridOff()
                  }
                />
                <FieldLabel htmlFor="hasGrid">Tem variações</FieldLabel>
              </Field>
              {hasGrid && <ProductGridSection disabled={isSubmitting} />}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{hasGrid ? "Variações" : "Código e preço"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductVariantsSection disabled={isSubmitting} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validade</CardTitle>
            <CardDescription>
              {productType === TProductType.Perishable
                ? "Perecível controla lote e validade."
                : "Opcional: use quando o produto vence."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                control={form.control}
                name="tracksLots"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="tracksLots"
                      checked={field.value}
                      disabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="tracksLots">Controla lote</FieldLabel>
                  </Field>
                )}
              />
              {tracksLots && (
                <FormInputField
                  control={form.control}
                  name="shelfLifeDays"
                  label="Vida útil (dias)"
                  inputMode="numeric"
                  className="md:max-w-xs"
                  disabled={isSubmitting}
                />
              )}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sazonalidade</CardTitle>
            {productType === TProductType.Apparel && (
              <CardDescription>
                Em vestuário, a coleção organiza as peças por temporada.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                control={form.control}
                name="collectionId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Coleção</FieldLabel>
                    <SearchSelect<IOption>
                      placeholder="Sem coleção"
                      data={collectionOptions}
                      disabled={isSubmitting}
                      field={{
                        value: field.value,
                        onChange: (value) =>
                          field.onChange(value ? String(value) : ""),
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="launchedOn"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Lançamento</FieldLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      maxDate={MAX_DATE}
                      error={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {isEdit ? "Salvar" : "Criar"}
          </Button>
        </div>
        <ConfirmWarningDialog state={confirmWarning} />
      </form>
    </FormProvider>
  );
}
