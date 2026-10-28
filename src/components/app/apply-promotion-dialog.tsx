import { useState } from "react";
import { Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromotionForm } from "@/components/forms/promotion-form";
import { useForecast } from "@/hooks/use-forecast";
import type { IForecastRecommendation } from "@/interfaces/forecast.interface";
import type { PromotionSchema } from "@/schemas/promotion.schema";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { addDaysToDateOnly, getTodayDateOnly } from "@/utils/date.helpers";
import { formatDiscount } from "@/utils/forecast.helpers";

const DEFAULT_PROMOTION_DAYS = 14;
const DEFAULT_DISCOUNT = 10;

type ApplyPromotionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: IForecastRecommendation | null;
  onSuccess?: (updated: IForecastRecommendation) => void;
};

function ApplyPromotionContent({
  recommendation,
  onClose,
  onSuccess,
}: {
  recommendation: IForecastRecommendation;
  onClose: () => void;
  onSuccess?: (updated: IForecastRecommendation) => void;
}) {
  const { applyPromotion } = useForecast();
  const [isLoading, setIsLoading] = useState(false);
  const [defaultValues] = useState<Partial<PromotionSchema>>(() => {
    const today = getTodayDateOnly();
    return {
      productId: recommendation.productId,
      discountPercent:
        Number(recommendation.suggestedDiscountPercent) || DEFAULT_DISCOUNT,
      startDate: today,
      // período inclusivo: "N dias" = hoje + (N − 1), como o backend conta
      endDate: addDaysToDateOnly(
        today,
        (Number(recommendation.suggestedPromotionDays) ||
          DEFAULT_PROMOTION_DAYS) - 1
      ),
      reason: "",
    };
  });

  const handleSubmit = async (data: PromotionSchema) => {
    try {
      setIsLoading(true);
      const updated = await applyPromotion(recommendation.id, {
        discountPercent: data.discountPercent,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason?.trim() ? data.reason.trim() : undefined,
      });
      handleSuccess(
        `Promoção de ${formatDiscount(data.discountPercent)} criada para ${recommendation.product.name}.`
      );
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      handleError(error, "Erro ao aplicar a promoção");
    } finally {
      setIsLoading(false);
    }
  };

  const { product } = recommendation;

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>Aplicar desconto</DialogTitle>
        <DialogDescription>
          {product.name}
          {product.productCode ? ` · Cód. ${product.productCode}` : ""}
        </DialogDescription>
      </DialogHeader>

      {(recommendation.suggestedDiscountPercent ||
        recommendation.suggestedPromotionDays) && (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200/60 bg-violet-50 p-3 text-xs text-violet-800 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Sugestão:{" "}
            <strong>
              {formatDiscount(recommendation.suggestedDiscountPercent)}
            </strong>
            {recommendation.suggestedPromotionDays
              ? ` por ${recommendation.suggestedPromotionDays} dias`
              : ""}
            . Você pode ajustar os valores antes de confirmar.
          </span>
        </div>
      )}

      <PromotionForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        submitLabel="Aplicar desconto"
        pricePreview={{
          price: Number(product.price),
          costPrice: product.costPrice,
        }}
      />
    </>
  );
}

/** Dialog "Aplicar desconto" (Admin) → POST /forecasts/recommendations/{id}/promotion */
export function ApplyPromotionDialog({
  open,
  onOpenChange,
  recommendation,
  onSuccess,
}: ApplyPromotionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open && recommendation && (
          <ApplyPromotionContent
            key={recommendation.id}
            recommendation={recommendation}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
