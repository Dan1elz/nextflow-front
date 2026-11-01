import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductFormData } from "@/schemas/product.schema";
import { combinationLabel } from "@/utils/product.helpers";

/** Seção Variações do T2: sempre aparece; sem grade é uma linha, a variação oculta, sem combinação (RN-CE48). */
export function ProductVariantsSection({ disabled }: { disabled: boolean }) {
  const { register, watch, setValue, getValues, formState } =
    useFormContext<ProductFormData>();
  const hasGrid = watch("hasGrid");
  const attributes = watch("attributes");
  const variants = watch("variants");
  const errors = formState.errors.variants;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {hasGrid && <TableHead>Combinação</TableHead>}
              <TableHead className="min-w-36">SKU</TableHead>
              <TableHead className="min-w-36">Código de barras</TableHead>
              <TableHead className="min-w-32">Preço</TableHead>
              {hasGrid && <TableHead>Ativa</TableHead>}
              {hasGrid && <TableHead className="sr-only">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant, index) => (
              <TableRow key={variant.id ?? variant.attributeValueIds.join("|")}>
                {hasGrid && (
                  <TableCell className="font-medium">
                    {combinationLabel(attributes, variant.attributeValueIds)}
                    {errors?.[index]?.attributeValueIds && (
                      <FieldError
                        errors={[
                          errors[index].attributeValueIds as {
                            message?: string;
                          },
                        ]}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className="align-top">
                  <InputGroup>
                    <InputGroupInput
                      aria-label="SKU"
                      disabled={disabled}
                      aria-invalid={Boolean(errors?.[index]?.sku)}
                      {...register(`variants.${index}.sku`)}
                    />
                  </InputGroup>
                  {errors?.[index]?.sku && (
                    <FieldError errors={[errors[index].sku]} />
                  )}
                  {errors?.[index]?.id && (
                    <FieldError errors={[errors[index].id]} />
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <InputGroup>
                    <InputGroupInput
                      aria-label="Código de barras"
                      disabled={disabled}
                      aria-invalid={Boolean(errors?.[index]?.barcode)}
                      {...register(`variants.${index}.barcode`)}
                    />
                  </InputGroup>
                  {errors?.[index]?.barcode && (
                    <FieldError errors={[errors[index].barcode]} />
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>R$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-label="Preço"
                      inputMode="decimal"
                      disabled={disabled}
                      aria-invalid={Boolean(errors?.[index]?.price)}
                      {...register(`variants.${index}.price`)}
                    />
                  </InputGroup>
                  {errors?.[index]?.price && (
                    <FieldError errors={[errors[index].price]} />
                  )}
                </TableCell>
                {hasGrid && (
                  <TableCell>
                    {/* Sem Controller: a linha muda de índice ao gerar ou remover, e o Controller renomeado deixava isActive indefinido. */}
                    <Switch
                      aria-label="Variação ativa"
                      checked={variant.isActive}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        setValue(`variants.${index}.isActive`, checked)
                      }
                    />
                  </TableCell>
                )}
                {hasGrid && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      aria-label="Remover variação"
                      onClick={() =>
                        setValue(
                          "variants",
                          getValues("variants").filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {errors?.message && <FieldError errors={[{ message: errors.message }]} />}
      {errors?.root?.message && (
        <FieldError errors={[{ message: errors.root.message }]} />
      )}
    </div>
  );
}
