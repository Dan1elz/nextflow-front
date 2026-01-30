import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/app/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ButtonLoader } from "@/components/ui/button-loader";
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientFormData,
  type UpdateClientFormData,
} from "@/schemas/client.schema";
import { formatCpfCnpj, formatOnlyNumbers } from "@/utils/format.helpers";
import type { IClient } from "@/interfaces/client.interface";

interface ClientFormProps {
  onSubmit: (
    data: CreateClientFormData | UpdateClientFormData
  ) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: IClient;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
}

export function ClientForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
}: ClientFormProps) {
  const schema = isEdit ? updateClientSchema : createClientSchema;
  const form = useForm<CreateClientFormData | UpdateClientFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          lastName: initialData.lastName,
          cpf: initialData.cpf ? formatCpfCnpj(initialData.cpf) : "",
          birthDate: initialData.birthDate || "",
        }
      : {
          name: "",
          lastName: "",
          cpf: "",
          birthDate: "",
        },
  });

  const handleCpfChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    const numbers = formatOnlyNumbers(value);
    if (numbers.length <= 11) {
      const formatted = formatCpfCnpj(numbers);
      onChange(formatted);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="Nome"
                      className="pl-9"
                      disabled={isLoading || disabled}
                      autoComplete="given-name"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="Sobrenome"
                      className="pl-9"
                      disabled={isLoading || disabled}
                      autoComplete="family-name"
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
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading || disabled}
                    maxDate={new Date()}
                    placeholder="dd/mm/aaaa"
                    error={!!form.formState.errors.birthDate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="000.000.000-00"
                      className="pl-9"
                      disabled={isLoading || disabled}
                      maxLength={14}
                      onChange={(e) =>
                        handleCpfChange(e.target.value, field.onChange)
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
