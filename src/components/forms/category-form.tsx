import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ICategory } from "@/interfaces/category.interface"; 
import { categorySchema, type CategorySchema } from "@/schemas/category.schema";

interface CategoryFormProps {
  onSubmit: (data: CategorySchema) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: ICategory;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
  data: IOption[];
  onSearch: (query: string) => Promise<IOption[] | void> | IOption[] | void;
}

export function CategoryForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
}: CategoryFormProps) {
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          description: initialData.description,
        }
      : {
          description: "",
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isEdit && (
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      className="pl-9 bg-muted"
                      disabled
                      readOnly
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                    placeholder="Ex: Eletrônicos, Alimentos..."
                    className="pl-9 uppercase"
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
                {isEdit ? "Salvar Alterações" : "Criar Categoria"}
              </ButtonLoader>
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
