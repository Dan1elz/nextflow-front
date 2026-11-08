import { useState } from "react";
import { ArrowRight, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import type { IForecastRecommendationListItem } from "@/interfaces/forecast.interface";
import { forecastRunService } from "@/services/forecast-run.service";
import { formatNumber } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

/**
 * Aplicar "Transferir" (F3.4b): confirma a transferência sugerida (origem → destino, quantidade) e a lança na hora (RN-CE62),
 * saindo por FEFO e entrando nos mesmos lotes. A recomendação fica Aplicada.
 */
export function ApplyTransferDialog({
  recommendation,
  onOpenChange,
  onDone,
}: {
  recommendation: IForecastRecommendationListItem | null;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const transfer = recommendation?.transfer;

  const apply = async () => {
    if (!recommendation) return;
    setSaving(true);
    try {
      await forecastRunService.applyTransfer(
        recommendation.id,
        token ?? undefined
      );
      handleSuccess("Transferência lançada.", {
        description: `${transfer?.fromLocationName} → ${transfer?.toLocationName}`,
      });
      onDone?.();
      onOpenChange(false);
    } catch (error) {
      handleError(error, "Erro ao transferir");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={recommendation != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir estoque</DialogTitle>
          <DialogDescription>
            {recommendation?.productName}: o destino está abaixo do mínimo e a
            origem tem sobra. Sai e entra na hora, nos mesmos lotes.
          </DialogDescription>
        </DialogHeader>
        {transfer && recommendation && (
          <div className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <span className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground">De</span>
                <span className="break-words">{transfer.fromLocationName}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-col text-right">
                <span className="text-xs text-muted-foreground">Para</span>
                <span className="font-medium break-words">
                  {transfer.toLocationName}
                </span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Quantidade</span>
              <span className="text-2xl font-semibold text-primary tabular-nums">
                {formatNumber(transfer.quantity, recommendation.decimalPlaces)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {recommendation.saleUnit}
                </span>
              </span>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Voltar
          </Button>
          <Button onClick={() => void apply()} disabled={saving}>
            {saving ? <Spinner data-icon="inline-start" /> : <ArrowRightLeft />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
