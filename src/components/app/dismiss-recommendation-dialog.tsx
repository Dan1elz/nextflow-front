import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonLoader } from "@/components/ui/button-loader";
import { useForecast } from "@/hooks/use-forecast";
import type { IForecastRecommendation } from "@/interfaces/forecast.interface";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type DismissRecommendationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: IForecastRecommendation | null;
  onSuccess?: (updated: IForecastRecommendation) => void;
};

function DismissContent({
  recommendation,
  onClose,
  onSuccess,
}: {
  recommendation: IForecastRecommendation;
  onClose: () => void;
  onSuccess?: (updated: IForecastRecommendation) => void;
}) {
  const { dismissRecommendation } = useForecast();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const updated = await dismissRecommendation(recommendation.id, reason);
      handleSuccess("Recomendação descartada.");
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      handleError(error, "Erro ao descartar a recomendação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AlertDialogHeader className="text-left">
        <AlertDialogTitle>Descartar recomendação?</AlertDialogTitle>
        <AlertDialogDescription>
          A recomendação para <strong>{recommendation.product.name}</strong>{" "}
          será marcada como descartada e não aparecerá mais como pendente.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="dismiss-reason">Motivo (opcional)</Label>
        <Input
          id="dismiss-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: já negociado com o fornecedor"
          maxLength={255}
          disabled={isLoading}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>Voltar</AlertDialogCancel>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          <ButtonLoader isLoading={isLoading} loadingText="Descartando...">
            Descartar
          </ButtonLoader>
        </Button>
      </AlertDialogFooter>
    </>
  );
}

/** Confirmação de "Descartar" → POST /forecasts/recommendations/{id}/dismiss */
export function DismissRecommendationDialog({
  open,
  onOpenChange,
  recommendation,
  onSuccess,
}: DismissRecommendationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {open && recommendation && (
          <DismissContent
            key={recommendation.id}
            recommendation={recommendation}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
