import { PromotionCreateForm } from "@/components/forms/promotion-create-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePromotions } from "@/hooks/use-promotions";
import type { PromotionRequestDto } from "@/interfaces/promotion.interface";
import { handleSuccess } from "@/utils/toast.helpers";

interface PromotionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixedProduct?: { id: string; name: string } | null;
  onCreated: () => void;
}

/** Dialog de nova promoção (T-VD7). Precisa do `PromotionsProvider`. */
export function PromotionCreateDialog({
  open,
  onOpenChange,
  fixedProduct,
  onCreated,
}: PromotionCreateDialogProps) {
  const { createPromotion } = usePromotions();

  const handleSubmit = async (dto: PromotionRequestDto) => {
    await createPromotion(dto);
    handleSuccess("Promoção criada com sucesso");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova promoção</DialogTitle>
          <DialogDescription>
            Desconto por período, para o produto inteiro ou uma variação.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PromotionCreateForm
            fixedProduct={fixedProduct}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
