import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchSelect } from "@/components/app/search-select";
import type { IOption } from "@/interfaces/api.interface";
import { ButtonLoader } from "@/components/ui/button-loader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  stockMovementSchema,
  type StockMovementSchema,
} from "@/schemas/stock-movement.schema";
import { TMovementType, MOVEMENT_TYPE_LABELS } from "@/types/enums";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";

interface StockMovementFormProps {
  initialData?: IStockMovement;
  onSubmit: (data: StockMovementSchema) => Promise<void>;
  isLoading?: boolean;
  hideProduct?: boolean;
  productName?: string;
  productId?: string;
  productOptions?: IOption[];
  onSearchProducts?: (
    query: string
  ) => Promise<IOption[] | void> | IOption[] | void;
  disabled?: boolean;
  onCancel?: () => void;
}

export function StockMovementForm({
  initialData,
  onSubmit,
  isLoading,
  hideProduct,
  productId,
  productName,
  productOptions = [],
  onSearchProducts,
  disabled = false,
  onCancel,
}: StockMovementFormProps) {
  const form = useForm<StockMovementSchema>({
    resolver: zodResolver(stockMovementSchema) as never,
    defaultValues: {
      productId: initialData?.productId || productId || "",

      description: initialData?.description || "",
      movementType: initialData?.movementType || TMovementType.Entry,
      quantity: Number(initialData?.quantity) || 0,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) =>
          console.log("Erros no Form:", errors)
        )}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {hideProduct ? (
            <div className="space-y-2">
              <Label>Produto</Label>
              <Input
                disabled
                value={initialData?.product?.name || productName || ""}
              />
            </div>
          ) : (
            onSearchProducts && (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SearchSelect
                        field={field}
                        value={field.value as string}
                        onChange={field.onChange}
                        label="Produto"
                        data={productOptions}
                        onSearch={onSearchProducts}
                        placeholder="Produto"
                        disabled={isLoading || disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          )}

          {disabled && initialData?.user && (
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input
                disabled
                value={`${initialData.user.name} ${initialData.user.lastName}`}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="movementType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                  disabled={isLoading || disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.keys(TMovementType) as Array<
                        keyof typeof TMovementType
                      >
                    )
                      .filter(
                        (key) =>
                          TMovementType[key] === TMovementType.Entry ||
                          TMovementType[key] === TMovementType.Exit ||
                          TMovementType[key] === TMovementType.Adjustment
                      )
                      .map((key) => {
                        const type = TMovementType[key];
                        return (
                          <SelectItem key={type} value={String(type)}>
                            {MOVEMENT_TYPE_LABELS[type as TMovementType]}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
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
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    disabled={isLoading || disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descrição da movimentação opcional..."
                    className="min-h-[100px] resize-y uppercase"
                    disabled={isLoading || disabled}
                    autoComplete="off"
                    maxLength={255}
                    onChange={(e) => {
                      field.onChange(e.target.value.toUpperCase());
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {(!disabled || onCancel) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => (onCancel ? onCancel() : window.history.back())}
            >
              {disabled ? "Fechar" : "Cancelar"}
            </Button>
          )}
          {!disabled && (
            <Button type="submit" disabled={isLoading || disabled}>
              <ButtonLoader isLoading={!!isLoading} loadingText={"Salvando..."}>
                Salvar
              </ButtonLoader>
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
