import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonLoader } from "@/components/ui/button-loader";
import { Separator } from "@/components/ui/separator";

import { formatCurrency } from "@/utils";
import { TPaymentMethod, PAYMENT_METHOD_LABELS } from "@/types/enums";
import type { IOrder } from "@/interfaces/order.interface";
import type { IPayment } from "@/interfaces/sale.interface";
import { createSaleSchema, type CreateSaleSchema } from "@/schemas/sale.schema";

interface SaleCheckoutFormProps {
  order: IOrder;
  onFinalize: (payments: IPayment[]) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function SaleCheckoutForm({
  order,
  onFinalize,
  isLoading,
  onCancel,
}: SaleCheckoutFormProps) {
  const form = useForm<CreateSaleSchema>({
    resolver: zodResolver(createSaleSchema) as never,
    defaultValues: {
      orderId: order.id || "",
      payments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const totalAmount = useMemo(() => Number(order.totalAmount || 0), [order]);

  const totalPaid = useMemo(
    () => fields.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
    [fields]
  );

  const remaining = useMemo(() => {
    const val = totalAmount - totalPaid;
    return val > 0 ? val : 0;
  }, [totalAmount, totalPaid]);

  const [inputMethod, setInputMethod] = useState<TPaymentMethod>(
    TPaymentMethod.Cash
  );
  const [inputAmount, setInputAmount] = useState<number>(remaining);

  useEffect(() => {
    // eslint-disable-next-line
    setInputAmount(remaining > 0 ? remaining : 0);
  }, [remaining]);

  const handleMethodChange = (v: string) =>
    setInputMethod(Number(v) as TPaymentMethod);

  const handleAddPayment = () => {
    if (inputAmount <= 0) return;
    if (inputAmount > remaining + 0.01) return;

    append({
      paymentMethod: inputMethod,
      amount: inputAmount,
    });
  };

  const isComplete = Math.abs(totalAmount - totalPaid) < 0.01;

  const onSubmit = async (data: CreateSaleSchema) => {
    if (!isComplete) return;
    // Map string id if anything is needed, but the schema has array of objects
    await onFinalize(data.payments as IPayment[]);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 flex flex-col pt-2"
      >
        {/* Resumo Dinâmico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-xl p-4 bg-muted/30">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card">
            <span className="text-xs uppercase font-semibold text-muted-foreground mb-1">
              Total Pedido
            </span>
            <span className="text-xl font-bold">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card">
            <span className="text-xs uppercase font-semibold text-muted-foreground mb-1">
              Pago
            </span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(totalPaid)}
            </span>
          </div>
          <div
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${remaining > 0 ? "bg-orange-500/10 border-orange-500/30" : "bg-green-500/10 border-green-500/30"}`}
          >
            <span
              className={`text-xs uppercase font-semibold mb-1 ${remaining > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}
            >
              Faltante
            </span>
            <span
              className={`text-xl font-bold ${remaining > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}
            >
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Inputs para adicionar novo pagamento */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-sm">Adicionar Pagamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-5 grid gap-2">
              <Label>Método de Pagamento</Label>
              <Select
                value={String(inputMethod)}
                onValueChange={handleMethodChange}
                disabled={remaining <= 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(TPaymentMethod) as Array<
                      keyof typeof TPaymentMethod
                    >
                  ).map((key) => {
                    const methodVal = TPaymentMethod[key];
                    return (
                      <SelectItem key={methodVal} value={String(methodVal)}>
                        {PAYMENT_METHOD_LABELS[methodVal]}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-4 grid gap-2">
              <Label>Valor</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={inputAmount}
                onChange={(e) => setInputAmount(Number(e.target.value))}
                disabled={remaining <= 0}
              />
            </div>

            <div className="sm:col-span-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleAddPayment}
                disabled={
                  remaining <= 0 ||
                  inputAmount <= 0 ||
                  inputAmount > remaining + 0.01
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Inserir
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Pagamentos Inseridos */}
        <div className="flex flex-col gap-3 min-h-[120px]">
          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border-2 border-dashed rounded-xl h-full mt-2">
              <AlertCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Nenhum pagamento registrado.
                <br />
                Insira no painel acima.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {fields.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/60 shadow-sm animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {PAYMENT_METHOD_LABELS[p.paymentMethod as TPaymentMethod]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Adicionado
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">
                      {formatCurrency(p.amount)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <FormField
            control={form.control}
            name="payments"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} value={fields.length} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isComplete || isLoading}
            className={
              isComplete ? "bg-green-600 hover:bg-green-700 text-white" : ""
            }
          >
            <ButtonLoader
              isLoading={!!isLoading}
              loadingText={"Finalizando..."}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Finalizar Venda
            </ButtonLoader>
          </Button>
        </div>
      </form>
    </Form>
  );
}
