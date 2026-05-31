import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard } from "lucide-react";

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
import {
  createSupplierSchema,
  updateSupplierSchema,
  type CreateSupplierFormData,
  type UpdateSupplierFormData,
} from "@/schemas/supplier.schema";
import { formatCpfCnpj, formatOnlyNumbers } from "@/utils/format.helpers";
import type { ISupplier } from "@/interfaces/supplier.interface";

interface SupplierFormProps {
  onSubmit: (
    data: CreateSupplierFormData | UpdateSupplierFormData
  ) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: ISupplier;
  isEdit?: boolean;
  disabled?: boolean;
  onBack?: () => void;
}

export function SupplierForm({
  onSubmit,
  isLoading = false,
  initialData,
  isEdit = false,
  disabled = false,
  onBack,
}: SupplierFormProps) {
  const schema = isEdit ? updateSupplierSchema : createSupplierSchema;

  const form = useForm<CreateSupplierFormData | UpdateSupplierFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          cnpj: initialData.cnpj ? formatCpfCnpj(initialData.cnpj) : "",
        }
      : {
          name: "",
          cnpj: "",
        },
  });

  const handleCnpjChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    const numbers = formatOnlyNumbers(value);
    // CNPJ tem 14 números
    if (numbers.length <= 14) {
      const formatted = formatCpfCnpj(numbers);
      onChange(formatted);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Fornecedor</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="Razão Social ou Nome Fantasia"
                      className="pl-9"
                      disabled={isLoading || disabled}
                      autoComplete="organization"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="00.000.000/0000-00"
                      className="pl-9"
                      disabled={isLoading || disabled}
                      maxLength={18} // Tamanho do CNPJ formatado
                      onChange={(e) =>
                        handleCnpjChange(e.target.value, field.onChange)
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-full flex justify-end gap-2 pt-4">
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
