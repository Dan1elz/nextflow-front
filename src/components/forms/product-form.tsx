import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Barcode,
  Calendar,
  CircleDollarSign,
  Package,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchSelect } from "@/components/app/search-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IOption } from "@/interfaces/api.interface";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ButtonLoader } from "@/components/ui/button-loader";
import type { IProduct } from "@/interfaces/product.interface";
import { productSchema, type ProductSchema } from "@/schemas/product.schema";
import { TUnitType, UNIT_TYPE_LABELS } from "@/types/enums";
import { DatePicker } from "../app/date-picker";
import { ImagePicker } from "../app/image-picker";

interface ProductFormProps {
  onSubmit: (data: ProductSchema) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: IProduct;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
  supplierOptions: IOption[];
  onSearchSuppliers: (
    query: string
  ) => Promise<IOption[] | void> | IOption[] | void;
  categoryOptions: IOption[];
  onSearchCategory: (
    query: string
  ) => Promise<IOption[] | void> | IOption[] | void;
}

export function ProductForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
  supplierOptions,
  onSearchSuppliers,
  categoryOptions,
  onSearchCategory,
}: ProductFormProps) {
  const form = useForm<ProductSchema>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: initialData
      ? {
          supplierId: initialData.supplierId,
          productCode: initialData.productCode,
          name: initialData.name,
          image:
            typeof initialData.image === "string" && initialData.image
              ? initialData.image
              : undefined,
          description: initialData.description,
          categoryIds:
            initialData.categoryIds ??
            initialData.categories
              ?.map((c) => c.id)
              .filter((id): id is string => id != null) ??
            [],
          quantity: Number(initialData.quantity) || 0,
          unitType: Number(initialData.unitType) as TUnitType,
          price: Number(initialData.price) || 0,
          validity: initialData.validity ?? "",
        }
      : {
          supplierId: "",
          productCode: "",
          name: "",
          image: undefined,
          description: "",
          categoryIds: [],
          quantity: 0,
          unitType: TUnitType.Unit,
          price: 0,
          validity: "",
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SearchSelect
                  field={field}
                  value={field.value}
                  onChange={field.onChange}
                  label="Fornecedor"
                  data={supplierOptions}
                  onSearch={onSearchSuppliers}
                  placeholder="Fornecedor"
                  disabled={isLoading || disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código do Produto</FormLabel>
              <FormControl>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Código do produto"
                    className="pl-9"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Nome do produto"
                    className="pl-9"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    maxLength={100}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem do produto</FormLabel>
              <FormControl>
                <ImagePicker
                  value={field.value}
                  onChange={(file) => field.onChange(file ?? undefined)}
                  disabled={isLoading || disabled}
                  size={140}
                  placeholder="Selecione uma imagem"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SearchSelect
                  field={field as never}
                  label="Categorias"
                  data={categoryOptions as unknown as Record<string, unknown>[]}
                  onSearch={
                    onSearchCategory as (
                      q: string
                    ) => Promise<Record<string, unknown>[] | void>
                  }
                  placeholder="Selecione as categorias"
                  disabled={isLoading || disabled}
                  multiple
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Quantidade em estoque"
                    className="pl-9"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    min={0}
                    step="any"
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? 0 : Number(v));
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unitType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade de Medida</FormLabel>
              <Select
                disabled={isLoading || disabled}
                value={String(field.value ?? "")}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço</FormLabel>
              <FormControl>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Preço do produto"
                    className="pl-9"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    min={0}
                    step="any"
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? 0 : Number(v));
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="validity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Validade</FormLabel>
              <FormControl>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    disabled={isLoading || disabled}
                    maxDate={new Date(2100, 11, 31)}
                    placeholder="dd/mm/aaaa"
                    error={!!form.formState.errors.validity}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descrição do produto"
                  className="min-h-[100px] resize-y uppercase"
                  disabled={isLoading || disabled}
                  autoComplete="off"
                  maxLength={500}
                  onChange={(e) => {
                    field.onChange(e.target.value.toUpperCase());
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          {onBack && (
            <Button type="button" onClick={onBack} variant="secondary">
              Voltar
            </Button>
          )}
          {!disabled && (
            <Button type="submit" disabled={isLoading || disabled}>
              <ButtonLoader
                isLoading={isLoading}
                loadingText={isEdit ? "Salvando..." : "Criando..."}
              >
                {isEdit ? "Salvar" : "Criar"}
              </ButtonLoader>
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
