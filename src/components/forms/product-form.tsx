import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Hash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/app/search-select";
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
import { DatePicker } from "../app/date-picker";

interface ProductFormProps {
  onSubmit: (data: ProductSchema) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: IProduct;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
  data: IOption[];
  onSearch: (query: string) => Promise<IOption[] | void> | IOption[] | void;
}

export function ProductForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
  data,
  onSearch,
}: ProductFormProps) {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          supplierId: initialData.supplierId,
          productCode: initialData.productCode,
          name: initialData.name,
          description: initialData.description,
          categoryIds: initialData.categoryIds,
          quantity: initialData.quantity,
          unitType: initialData.unitType,
          price: initialData.price,
          validity: initialData.validity,
        }
      : {
          supplierId: "",
          productCode: "",
          name: "",
          description: "",
          categoryIds: [],
          quantity: 0,
          unitType: "",
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
                  data={data}
                  onSearch={onSearch}
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
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Nome do produo"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Descrição do produto"
                    className="pl-9 uppercase"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    maxLength={500}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SearchSelect
                  field={field}
                  value={field.value}
                  onChange={field.onChange}
                  label="Código da Categoria"
                  data={data}
                  onSearch={onSearch}
                  placeholder="Selecione a Categoria"
                  disabled={isLoading || disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Nome do produo"
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
          name="unitType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SearchSelect
                  field={field}
                  value={field.value}
                  onChange={field.onChange}
                  label="Unidade de Medida"
                  data={data}
                  onSearch={onSearch}
                  placeholder="Selecione a Unidade de Medida"
                  disabled={isLoading || disabled}
                />
              </FormControl>
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
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="number"
                    placeholder="Preço do produto"
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
          name="validity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Validade</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading || disabled}
                    maxDate={new Date()}
                    placeholder="dd/mm/aaaa"
                    error={!!form.formState.errors.validity}
                  />
                </div>
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
