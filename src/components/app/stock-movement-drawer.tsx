import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { StockMovementForm } from "@/components/forms/stock-movement-form";
import { useStockMovements } from "@/hooks/use-stock-movements";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";
import type { StockMovementSchema } from "@/schemas/stock-movement.schema";
import { type TMovementType } from "@/types/enums";
import { useSearchOptions } from "@/hooks/use-search-options";
import type { IProduct } from "@/interfaces/product.interface";
import { useProducts } from "@/hooks/use-products";

interface StockMovementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockMovement?: IStockMovement | null;
  isViewing?: boolean;
  onSuccess?: () => void;
  productId?: string;
  productName?: string;
  hideProduct?: boolean;
}

export function StockMovementDrawer({
  open,
  onOpenChange,
  stockMovement,
  isViewing = false,
  onSuccess,
  productId: fixedProductId,
  productName,
  hideProduct = false,
}: StockMovementDrawerProps) {
  const { createStockMovement } = useStockMovements();
  const { searchProductsForOptions, getProductById } = useProducts();
  const [isLoading, setIsLoading] = useState(false);

  const { options: productOptions, handleSearch: handleSearchProducts } =
    useSearchOptions<IProduct>({
      searchFn: async (params) => {
        return await searchProductsForOptions(params);
      },
      mapFn: (product) => ({
        value: product.id ?? "",
        label: product.name,
      }),
      selectFn: async (id) => {
        return await getProductById(id);
      },
      errorLabel: "produtos",
      autoLoad: true,
      perPage: 15,
      enabled: open, // Só carrega se o drawer estiver aberto
    });

  const handleSubmit = async (data: StockMovementSchema) => {
    try {
      if (isViewing) return;
      setIsLoading(true);

      const payload = {
        productId: fixedProductId || data.productId,

        description: data.description,
        movementType: data.movementType as TMovementType,
        quantity: data.quantity,
      };

      await createStockMovement(payload);
      handleSuccess("Movimentação de estoque adicionada com sucesso!");

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      handleError(error, "Erro ao processar a movimentação");
    } finally {
      setIsLoading(false);
    }
  };

  const title = isViewing ? "Visualizar Movimentação" : "Nova Movimentação";
  const desc = isViewing
    ? "Detalhes do registro da movimentação de estoque."
    : "Preencha as informações para registrar uma entrada, saída ou ajuste.";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8 overflow-y-auto">
          <DrawerHeader className="px-0">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{desc}</DrawerDescription>
          </DrawerHeader>

          <StockMovementForm
            initialData={stockMovement || undefined}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            disabled={isViewing}
            hideProduct={hideProduct}
            productId={fixedProductId}
            productName={productName}
            productOptions={hideProduct ? [] : productOptions}
            onSearchProducts={hideProduct ? undefined : handleSearchProducts}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
