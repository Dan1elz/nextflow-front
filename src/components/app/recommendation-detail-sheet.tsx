import {
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";

import { ForecastDetailView } from "@/components/app/forecast-detail";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendationDetail } from "@/hooks/use-forecast-detail";
import type { IForecastRecommendationListItem } from "@/interfaces/forecast.interface";
import { TRecommendationAction, TRecommendationStatus } from "@/types/enums";

type RecommendationDetailSheetProps = {
  /** Recomendação aberta; `null` fecha o painel. */
  recommendationId: string | null;
  onClose: () => void;
  /** "Comprar" pendente abre o dialog T-DF4. */
  onBuy?: (recommendation: IForecastRecommendationListItem) => void;
  /** Promover pendente (Admin): o pai só passa quando o usuário pode. */
  onPromote?: (recommendation: IForecastRecommendationListItem) => void;
  onDismiss?: (recommendation: IForecastRecommendationListItem) => void;
  /** "Transferir" pendente (F3.4b) abre a confirmação. */
  onTransfer?: (recommendation: IForecastRecommendationListItem) => void;
};

/** Drawer lateral com o detalhe da recomendação (T-DF3). */
export function RecommendationDetailSheet({
  recommendationId,
  onClose,
  onBuy,
  onPromote,
  onDismiss,
  onTransfer,
}: RecommendationDetailSheetProps) {
  const pending = (rec: IForecastRecommendationListItem | null) =>
    rec?.status === TRecommendationStatus.Pending;
  const { data, error, loading, reload } =
    useRecommendationDetail(recommendationId);

  return (
    <Sheet
      open={recommendationId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle>
            {data?.productName ?? "Detalhe da recomendação"}
          </SheetTitle>
          <SheetDescription>
            {data
              ? (data.categoryPath ?? "Sem categoria")
              : "Recomendação da análise de demanda"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{error}</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={reload}>
                  <RefreshCw />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : loading || !data ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <ForecastDetailView product={data.product} detail={data} />
          )}
        </div>
        <SheetFooter className="border-t">
          <SheetClose asChild>
            <Button variant="outline">Fechar</Button>
          </SheetClose>
          {onBuy &&
            data &&
            data.action === TRecommendationAction.Buy &&
            data.status === TRecommendationStatus.Pending && (
              <Button onClick={() => onBuy(data)}>
                <ShoppingCart data-icon="inline-start" />
                Comprar
              </Button>
            )}
          {onPromote &&
            data &&
            pending(data) &&
            data.action === TRecommendationAction.Promote && (
              <Button onClick={() => onPromote(data)}>
                <Tag data-icon="inline-start" />
                Promover
              </Button>
            )}
          {onTransfer &&
            data &&
            pending(data) &&
            data.action === TRecommendationAction.Transfer &&
            data.transfer && (
              <Button onClick={() => onTransfer(data)}>
                <ArrowRightLeft data-icon="inline-start" />
                Transferir
              </Button>
            )}
          {onDismiss && data && pending(data) && (
            <Button variant="ghost" onClick={() => onDismiss(data)}>
              <X data-icon="inline-start" />
              Descartar
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
