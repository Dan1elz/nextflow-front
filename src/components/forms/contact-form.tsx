import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Mail } from "lucide-react";

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
import { contactSchema, type ContactFormData } from "@/schemas/contact.schema";
import type { IContact } from "@/interfaces/contact.interface";
import { formatPhone, formatOnlyNumbers } from "@/utils/format.helpers";

const formatFoneInput = (value: string) => {
  const n = formatOnlyNumbers(value);
  if (n.length > 11) return value;
  return formatPhone(n);
};

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: IContact | null;
  disabled?: boolean;
  onCancelEdit?: () => void;
}

export function ContactForm({
  onSubmit,
  isLoading = false,
  initialData,
  disabled = false,
  onCancelEdit,
}: ContactFormProps) {
  const isEdit = Boolean(initialData?.id);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      description: "",
      fone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description,
        fone: initialData.fone ? formatFoneInput(initialData.fone) : "",
        email: initialData.email ?? "",
      });
    } else {
      form.reset({
        description: "",
        fone: "",
        email: "",
      });
    }
  }, [initialData, form]);

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
                    placeholder="Ex.: Comercial, Celular pessoal"
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
            name="fone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="(00) 00000-0000"
                      className="pl-9"
                      maxLength={15}
                      disabled={isLoading || disabled}
                      onChange={(e) =>
                        field.onChange(formatFoneInput(e.target.value))
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@exemplo.com"
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
                {isEdit ? "Salvar" : "Adicionar contato"}
              </ButtonLoader>
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
