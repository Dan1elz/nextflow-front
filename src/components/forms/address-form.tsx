import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Hash, Building2, Navigation, Mail } from "lucide-react";

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
import { addressSchema, type AddressFormData } from "@/schemas/address.schema";
import type { IAddress } from "@/interfaces/address.interface";
import { formatCep, formatOnlyNumbers } from "@/utils/format.helpers";

const formatZipCode = (value: string) => {
  const n = formatOnlyNumbers(value);
  if (n.length <= 8) return formatCep(n);
  return value;
};

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: IAddress | null;
  disabled?: boolean;
  onCancelEdit?: () => void;
  stateData: IOption[];
  onSearchState: (
    query: string
  ) => Promise<IOption[] | void> | IOption[] | void;
  cityData: IOption[];
  onSearchCity: (query: string) => Promise<IOption[] | void> | IOption[] | void;
  onStateChange?: (stateId: string) => void;
}

export function AddressForm({
  onSubmit,
  isLoading = false,
  initialData,
  disabled = false,
  onCancelEdit,
  stateData,
  onSearchState,
  cityData,
  onSearchCity,
  onStateChange,
}: AddressFormProps) {
  const isEdit = Boolean(initialData?.id);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      description: "",
      street: "",
      number: "",
      district: "",
      stateId: "",
      cityId: "",
      complement: "",
      zipCode: "",
    },
  });

  const stateId = useWatch({ control: form.control, name: "stateId" });

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description,
        street: initialData.street,
        number: initialData.number,
        district: initialData.district,
        stateId: initialData.stateId,
        cityId: initialData.cityId,
        complement: initialData.complement ?? "",
        zipCode: formatZipCode(initialData.zipCode),
      });
      onStateChange?.(initialData.stateId);
    } else {
      form.reset({
        description: "",
        street: "",
        number: "",
        district: "",
        stateId: "",
        cityId: "",
        complement: "",
        zipCode: "",
      });
      onStateChange?.("");
    }
  }, [initialData, form, onStateChange]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="Ex.: Casa, Trabalho"
                    className="pl-9"
                    disabled={isLoading || disabled}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="00000-000"
                      className="pl-9"
                      maxLength={9}
                      disabled={isLoading || disabled}
                      onChange={(e) =>
                        field.onChange(formatZipCode(e.target.value))
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rua</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Nome da rua"
                      className="pl-9"
                      disabled={isLoading || disabled}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Nº"
                      className="pl-9"
                      disabled={isLoading || disabled}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Bairro"
                      className="pl-9"
                      disabled={isLoading || disabled}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Apto, bloco..."
                      className="pl-9"
                      disabled={isLoading || disabled}
                      value={field.value ?? ""}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stateId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchSelect
                    field={{
                      value: field.value,
                      onChange: (v) => {
                        field.onChange(v);
                        form.setValue("cityId", "");
                        onStateChange?.(String(v ?? ""));
                      },
                    }}
                    label="Estado"
                    data={stateData as unknown as Record<string, unknown>[]}
                    onSearch={async (q) =>
                      (await onSearchState(q)) as unknown as Record<
                        string,
                        unknown
                      >[]
                    }
                    placeholder="Selecione o estado"
                    disabled={isLoading || disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchSelect
                    field={field}
                    value={field.value}
                    onChange={field.onChange}
                    label="Cidade"
                    data={cityData as unknown as Record<string, unknown>[]}
                    onSearch={async (q) =>
                      (await onSearchCity(q)) as unknown as Record<
                        string,
                        unknown
                      >[]
                    }
                    placeholder="Selecione a cidade"
                    disabled={isLoading || disabled || !stateId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {isEdit && onCancelEdit && !disabled && (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancelar
            </Button>
          )}
          {!disabled && (
            <Button type="submit" disabled={isLoading}>
              <ButtonLoader
                isLoading={isLoading}
                loadingText={isEdit ? "Salvando..." : "Adicionando..."}
              >
                {isEdit ? "Salvar" : "Adicionar endereço"}
              </ButtonLoader>
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
