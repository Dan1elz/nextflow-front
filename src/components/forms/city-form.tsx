import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Hash, Building2 } from "lucide-react";

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
import type { ICity } from "@/interfaces/locations.interface";
import { citySchema, type CitySchema } from "@/schemas/city.schema";

interface CityFormProps {
  onSubmit: (data: CitySchema) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: ICity;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
  data: IOption[];
  onSearch: (query: string) => void | Promise<void>;
}

export function CityForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
  data,
  onSearch,
}: CityFormProps) {
  const form = useForm({
    resolver: zodResolver(citySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          ibgeCode: initialData.ibgeCode,
          stateId: initialData.stateId,
        }
      : {
          name: "",
          ibgeCode: "",
          stateId: "",
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="Nome da cidade"
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
          name="ibgeCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código IBGE</FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="BR"
                    className="pl-9 uppercase"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    maxLength={7}
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

        <FormField
          control={form.control}
          name="stateId"
          render={({ field: formField, fieldState }) => ( 
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <SearchSelect
                    field={field}
                    value={formField.value} 
                    onChange={formField.onChange}
                    label="Estado"
                    data={data}
                    onSearch={onSearch}
                    placeholder="Estado"
                    className="pl-9"
                    disabled={isLoading || disabled}
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
