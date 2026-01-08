import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Hash, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ButtonLoader } from "@/components/ui/button-loader";
import type { ICountry } from "@/interfaces/locations.interface";
import { countrySchema, type CountrySchema } from "@/schemas/country.schema";

interface CountryFormProps {
  onSubmit: (data: CountrySchema) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: ICountry;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
}

export function CountryForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
}: CountryFormProps) {
  const form = useForm({
    resolver: zodResolver(countrySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          acronymIso: initialData.acronymIso,
          bacenCode: initialData.bacenCode ?? "",
        }
      : {
          name: "",
          acronymIso: "",
          bacenCode: "",
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
                    placeholder="Nome do país"
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
          name="acronymIso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acrônimo ISO</FormLabel>
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
                    maxLength={2}
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
          name="bacenCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código BACEN</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Código BACEN (opcional)"
                    className="pl-9"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    value={field.value || ""}
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
