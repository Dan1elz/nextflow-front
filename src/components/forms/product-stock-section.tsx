import { useFormContext, useWatch } from "react-hook-form";

import { FormInputField } from "@/components/app/form-input-field";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import type { ProductFormData } from "@/schemas/product.schema";
import { combinationLabel } from "@/utils/product.helpers";

interface ProductStockSectionProps {
  locations: LocationOptionDto[];
  disabled: boolean;
}

/**
 * Seção Estoque do T2: mínimo padrão do produto, cobertura alvo própria (vazio = a da classe ABC, RN-CE29) e a tabela de
 * mínimos por variação × local (RN-CE33). Célula vazia usa o mínimo padrão.
 */
export function ProductStockSection({
  locations,
  disabled,
}: ProductStockSectionProps) {
  const { control, setValue, getValues, formState } =
    useFormContext<ProductFormData>();
  const variants = useWatch({ control, name: "variants" });
  const attributes = useWatch({ control, name: "attributes" });
  const hasGrid = useWatch({ control, name: "hasGrid" });
  const defaultMin = useWatch({ control, name: "defaultMinQuantity" });
  const errors = formState.errors.variants;

  const changeMinimum = (index: number, locationId: string, value: string) =>
    setValue(
      `variants.${index}.minimums`,
      { ...getValues(`variants.${index}.minimums`), [locationId]: value },
      { shouldDirty: true }
    );

  return (
    <FieldGroup>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInputField
          control={control}
          name="defaultMinQuantity"
          label="Mínimo padrão"
          inputMode="decimal"
          description="Vale em todo local sem mínimo próprio."
          disabled={disabled}
        />
        <FormInputField
          control={control}
          name="targetCoverageDays"
          label="Cobertura alvo (dias)"
          inputMode="numeric"
          description="Vazio usa a política da classe ABC."
          disabled={disabled}
        />
      </div>

      {locations.length === 0 ? (
        <FieldDescription>
          Cadastre um local de estoque para definir mínimos por local.
        </FieldDescription>
      ) : (
        <div className="flex flex-col gap-2">
          <FieldDescription>
            Mínimo por local: deixe vazio para usar o mínimo padrão.
          </FieldDescription>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{hasGrid ? "Combinação" : "Variação"}</TableHead>
                  {locations.map((location) => (
                    <TableHead key={location.id} className="min-w-32">
                      {location.name}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {location.storeName}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow
                    key={variant.id ?? variant.attributeValueIds.join("|")}
                  >
                    <TableCell className="align-top font-medium">
                      {hasGrid
                        ? combinationLabel(
                            attributes,
                            variant.attributeValueIds
                          )
                        : "Padrão"}
                      {errors?.[index]?.minimums && (
                        <FieldError
                          errors={[
                            errors[index].minimums as { message?: string },
                          ]}
                        />
                      )}
                    </TableCell>
                    {locations.map((location) => (
                      <TableCell key={location.id} className="align-top">
                        <InputGroup>
                          <InputGroupInput
                            aria-label={`Mínimo em ${location.name}`}
                            inputMode="decimal"
                            placeholder={defaultMin || "0"}
                            disabled={disabled}
                            aria-invalid={Boolean(errors?.[index]?.minimums)}
                            value={variant.minimums[location.id] ?? ""}
                            onChange={(event) =>
                              changeMinimum(
                                index,
                                location.id,
                                event.target.value
                              )
                            }
                          />
                        </InputGroup>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </FieldGroup>
  );
}
