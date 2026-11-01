import { useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierOptionDto } from "@/interfaces/product.interface";
import type { ProductFormData } from "@/schemas/product.schema";

interface ProductSuppliersSectionProps {
  options: SupplierOptionDto[];
  disabled: boolean;
}

/** Tabela Fornecedores do T2 (RN-CE27, RN-CE30): um por produto, um preferido, prazo vazio usa o do fornecedor. */
export function ProductSuppliersSection({
  options,
  disabled,
}: ProductSuppliersSectionProps) {
  const { register, watch, setValue, getValues, formState } =
    useFormContext<ProductFormData>();
  const suppliers = watch("suppliers");
  const errors = formState.errors.suppliers;

  const addRow = () =>
    setValue("suppliers", [
      ...getValues("suppliers"),
      {
        supplierId: "",
        isPreferred: getValues("suppliers").length === 0,
        supplierSku: "",
        leadTimeDays: "",
        minOrderQty: "",
        orderMultiple: "",
      },
    ]);

  const removeRow = (index: number) =>
    setValue(
      "suppliers",
      getValues("suppliers").filter((_, i) => i !== index)
    );

  // Marcar um como preferido desmarca os outros: o servidor só aceita um (RN-CE27).
  const prefer = (index: number, checked: boolean) =>
    setValue(
      "suppliers",
      getValues("suppliers").map((supplier, i) => ({
        ...supplier,
        isPreferred: checked && i === index,
      }))
    );

  const defaultLeadTime = (supplierId: string) =>
    options.find((option) => option.id === supplierId)?.leadTimeDays;

  return (
    <div className="flex flex-col gap-2">
      {suppliers.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyDescription>
              Nenhum fornecedor vinculado. Ele é necessário para a sugestão de
              compra.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-52">Fornecedor</TableHead>
                <TableHead>Preferido</TableHead>
                <TableHead className="min-w-32">Código no fornecedor</TableHead>
                <TableHead className="min-w-28">Prazo (dias)</TableHead>
                <TableHead className="min-w-28">Pedido mínimo</TableHead>
                <TableHead className="min-w-28">Múltiplo</TableHead>
                <TableHead className="sr-only">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier, index) => (
                <TableRow key={supplier.supplierId || `novo-${index}`}>
                  <TableCell className="align-top">
                    <Select
                      value={supplier.supplierId}
                      disabled={disabled}
                      onValueChange={(value) =>
                        setValue(`suppliers.${index}.supplierId`, value, {
                          shouldValidate: formState.isSubmitted,
                        })
                      }
                    >
                      <SelectTrigger
                        aria-label="Fornecedor"
                        aria-invalid={Boolean(errors?.[index]?.supplierId)}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {options.map((option) => (
                            <SelectItem
                              key={option.id}
                              value={option.id}
                              disabled={
                                suppliers.some(
                                  (s, i) =>
                                    i !== index && s.supplierId === option.id
                                ) ||
                                (!option.isActive && !supplier.supplierId)
                              }
                            >
                              {option.isActive
                                ? option.name
                                : `${option.name} (inativo)`}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors?.[index]?.supplierId && (
                      <FieldError errors={[errors[index].supplierId]} />
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {/* Sem Controller: a linha muda de índice ao remover. */}
                    <Switch
                      aria-label="Fornecedor preferido"
                      checked={supplier.isPreferred}
                      disabled={disabled}
                      onCheckedChange={(checked) => prefer(index, checked)}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <InputGroup>
                      <InputGroupInput
                        aria-label="Código no fornecedor"
                        disabled={disabled}
                        aria-invalid={Boolean(errors?.[index]?.supplierSku)}
                        {...register(`suppliers.${index}.supplierSku`)}
                      />
                    </InputGroup>
                    {errors?.[index]?.supplierSku && (
                      <FieldError errors={[errors[index].supplierSku]} />
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <InputGroup>
                      <InputGroupInput
                        aria-label="Prazo de entrega em dias"
                        inputMode="numeric"
                        placeholder={String(
                          defaultLeadTime(supplier.supplierId) ?? ""
                        )}
                        disabled={disabled}
                        aria-invalid={Boolean(errors?.[index]?.leadTimeDays)}
                        {...register(`suppliers.${index}.leadTimeDays`)}
                      />
                    </InputGroup>
                    {errors?.[index]?.leadTimeDays && (
                      <FieldError errors={[errors[index].leadTimeDays]} />
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <InputGroup>
                      <InputGroupInput
                        aria-label="Pedido mínimo"
                        inputMode="numeric"
                        disabled={disabled}
                        aria-invalid={Boolean(errors?.[index]?.minOrderQty)}
                        {...register(`suppliers.${index}.minOrderQty`)}
                      />
                    </InputGroup>
                    {errors?.[index]?.minOrderQty && (
                      <FieldError errors={[errors[index].minOrderQty]} />
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <InputGroup>
                      <InputGroupInput
                        aria-label="Múltiplo de compra"
                        inputMode="numeric"
                        disabled={disabled}
                        aria-invalid={Boolean(errors?.[index]?.orderMultiple)}
                        {...register(`suppliers.${index}.orderMultiple`)}
                      />
                    </InputGroup>
                    {errors?.[index]?.orderMultiple && (
                      <FieldError errors={[errors[index].orderMultiple]} />
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      aria-label="Remover fornecedor"
                      onClick={() => removeRow(index)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {errors?.message && <FieldError errors={[{ message: errors.message }]} />}
      {errors?.root?.message && (
        <FieldError errors={[{ message: errors.root.message }]} />
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addRow}
        >
          <Plus data-icon="inline-start" />
          Adicionar fornecedor
        </Button>
      </div>
    </div>
  );
}
