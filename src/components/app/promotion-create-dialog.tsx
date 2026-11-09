import { Sparkles } from "lucide-react";

import {
  PromotionCreateForm,
  type PromotionSuggestionDefaults,
} from "@/components/forms/promotion-create-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePromotions } from "@/hooks/use-promotions";
import type {
  PromotionListItemDto,
  PromotionRequestDto,
} from "@/interfaces/promotion.interface";
import { handleSuccess } from "@/utils/toast.helpers";

interface PromotionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixedProduct?: { id: string; name: string } | null;
  /** Promoção agendada a editar; sem ela, o dialog cria uma nova. */
  promotion?: PromotionListItemDto | null;
  /** Sugestão da IA (lote vencendo no painel): preenche o formulário e mostra o motivo. */
  suggestion?:
    | (PromotionSuggestionDefaults & { explanation: string; fromAi: boolean })
    | null;
  onCreated: () => void;
}

/** Dialog de nova promoção ou de edição da agendada (T-VD7). Precisa do `PromotionsProvider`. */
export function PromotionCreateDialog({
  open,
  onOpenChange,
  fixedProduct,
  promotion,
  suggestion,
  onCreated,
}: PromotionCreateDialogProps) {
  const { createPromotion, updatePromotion } = usePromotions();

  const handleSubmit = async (dto: PromotionRequestDto) => {
    if (promotion) {
      await updatePromotion(promotion.id, dto);
      handleSuccess("Promoção atualizada com sucesso");
    } else {
      await createPromotion(dto);
      handleSuccess("Promoção criada com sucesso");
    }
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {promotion ? "Editar promoção" : "Nova promoção"}
          </DialogTitle>
          <DialogDescription>
            {promotion
              ? "Ainda não começou: escopo, desconto, período e motivo podem mudar."
              : "Desconto por período, para o produto inteiro ou uma variação."}
          </DialogDescription>
        </DialogHeader>
        {open && suggestion && (
          <Alert>
            <Sparkles />
            <AlertTitle>
              {suggestion.fromAi
                ? "Sugestão da IA"
                : "Sugestão calculada (IA indisponível)"}
            </AlertTitle>
            <AlertDescription>{suggestion.explanation}</AlertDescription>
          </Alert>
        )}
        {open && (
          <PromotionCreateForm
            suggestion={suggestion}
            fixedProduct={fixedProduct}
            editing={promotion}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
