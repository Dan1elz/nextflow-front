import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PromotionForm,
  type PromotionPricePreview,
} from "@/components/forms/promotion-form";
import { usePromotions } from "@/hooks/use-promotions";
import { useProducts } from "@/hooks/use-products";
import { useSearchOptions } from "@/hooks/use-search-options";
import type { IProduct } from "@/interfaces/product.interface";
import type { IPromotion } from "@/interfaces/promotion.interface";
import type { PromotionSchema } from "@/schemas/promotion.schema";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { addDaysToDateOnly, getTodayDateOnly } from "@/utils/date.helpers";
import { formatDateOnly } from "@/utils/format.helpers";
import { formatDiscount } from "@/utils/forecast.helpers";

type CreatePromotionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (promotion: IPromotion) => void;
};

function CreatePromotionContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (promotion: IPromotion) => void;
}) {
  const { createPromotion } = usePromotions();
  const { searchProductsForOptions, getProductById } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [defaultValues] = useState<Partial<PromotionSchema>>(() => {
    const today = getTodayDateOnly();
    return {
      productId: "",
      discountPercent: 10,
      startDate: today,
      endDate: addDaysToDateOnly(today, 14),
      reason: "",
    };
  });

  const { options: productOptions, handleSearch: handleSearchProducts } =
    useSearchOptions<IProduct>({
      searchFn: searchProductsForOptions,
      mapFn: (p) => ({
        value: p.id ?? "",
        label: `${p.productCode} - ${p.name}`,
      }),
      selectFn: getProductById,
      errorLabel: "produtos",
      autoLoad: false,
      perPage: 50,
    });

  const handleProductChange = async (productId: string) => {
    if (!productId) {
      setSelectedProduct(null);
      return;
    }
    try {
      setSelectedProduct(await getProductById(productId));
    } catch (error) {
      setSelectedProduct(null);
      handleError(error, "Erro ao carregar o produto");
    }
  };

  const handleSubmit = async (data: PromotionSchema) => {
    try {
      setIsLoading(true);
      const created = await createPromotion({
        productId: data.productId,
        discountPercent: data.discountPercent,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason?.trim() ? data.reason.trim() : undefined,
      });
      handleSuccess(
        `Promoção de ${formatDiscount(data.discountPercent)} criada${selectedProduct ? ` para ${selectedProduct.name}` : ""}.`
      );
      onSuccess?.(created);
      onClose();
    } catch (error) {
      handleError(error, "Erro ao criar a promoção");
    } finally {
      setIsLoading(false);
    }
  };

  const pricePreview: PromotionPricePreview | null = selectedProduct
    ? {
        price: Number(selectedProduct.price),
        costPrice:
          selectedProduct.costPrice !== undefined &&
          selectedProduct.costPrice !== null &&
          selectedProduct.costPrice !== ""
            ? Number(selectedProduct.costPrice)
            : null,
      }
    : null;

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>Nova promoção</DialogTitle>
        <DialogDescription>
          Defina o desconto e o período. Enquanto vigente, o preço de venda do
          produto é reduzido automaticamente.
        </DialogDescription>
      </DialogHeader>

      {selectedProduct?.activePromotion && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Este produto já tem uma promoção vigente de{" "}
            {formatDiscount(selectedProduct.activePromotion.discountPercent)}{" "}
            até {formatDateOnly(selectedProduct.activePromotion.endDate)}. Não é
            permitido sobrepor períodos.
          </span>
        </div>
      )}

      <PromotionForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        submitLabel="Criar promoção"
        showProductSelect
        productOptions={productOptions}
        onSearchProducts={handleSearchProducts}
        onProductChange={(id) => void handleProductChange(id)}
        pricePreview={pricePreview}
      />
    </>
  );
}

/** Criação manual de promoção (Admin) → POST /api/promotions. Requer PromotionsProvider e ProductsProvider. */
export function CreatePromotionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePromotionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <CreatePromotionContent
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
