import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import {
  cancelPurchaseOrderSchema,
  type CancelPurchaseOrderFormData,
} from "@/schemas/purchase-order.schema";

interface CancelPurchaseOrderDialogProps {
  open: boolean;
  number: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}

/** Cancelar pedido de compra (T-CP5): motivo obrigatório; nada entra no estoque. */
export function CancelPurchaseOrderDialog({
  open,
  number,
  onOpenChange,
  onConfirm,
}: CancelPurchaseOrderDialogProps) {
  const form = useForm<CancelPurchaseOrderFormData>({
    resolver: zodResolver(cancelPurchaseOrderSchema),
    defaultValues: { reason: "" },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (data) => {
            if (await submit(() => onConfirm(data.reason))) {
              form.reset();
              onOpenChange(false);
            }
          })}
        >
          <DialogHeader>
            <DialogTitle>Cancelar pedido nº {number}?</DialogTitle>
            <DialogDescription>
              O pedido deixa de contar como estoque a caminho. Pedido cancelado
              não volta a ser editado.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Controller
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="cancel-reason">Motivo</FieldLabel>
                  <Textarea
                    {...field}
                    id="cancel-reason"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Voltar
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Cancelar pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
