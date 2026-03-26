import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SaleCheckoutForm } from "@/components/forms/sale-checkout-form";
import { useSales } from "@/hooks/use-sales";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IOrder } from "@/interfaces/order.interface";
import type { IPayment } from "@/interfaces/sale.interface";

interface SaleCheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: IOrder;
  onSuccess?: () => void;
}

export function SaleCheckoutDrawer({
  open,
  onOpenChange,
  order,
  onSuccess,
}: SaleCheckoutDrawerProps) {
  const { createSale } = useSales();
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalize = async (payments: IPayment[]) => {
    try {
      if (!order.id) return;

      setIsLoading(true);
      await createSale({
        orderId: order.id,
        payments,
      });

      handleSuccess("Venda finalizada com sucesso!");
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      handleError(error, "Erro ao finalizar a venda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8 overflow-y-auto">
          <DrawerHeader className="px-0">
            <DrawerTitle>Finalizar Venda</DrawerTitle>
            <DrawerDescription>
              Adicione os métodos de pagamento para completar o valor total do
              pedido.
            </DrawerDescription>
          </DrawerHeader>

          <SaleCheckoutForm
            order={order}
            onFinalize={handleFinalize}
            isLoading={isLoading}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
