import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { PromotionStatusBadge } from "@/components/app/promotion-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePromotions } from "@/hooks/use-promotions";
import type {
  PromotionListItemDto,
  PromotionPreviewDto,
} from "@/interfaces/promotion.interface";
import { PROMOTION_SOURCE_LABELS } from "@/types/enums";
import {
  formatCurrency,
  formatDateOnly,
  formatPercentage,
} from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-anywhere">{value}</dd>
    </div>
  );
}

/**
 * Visualizar promoção (T-VD7): dados gravados e, por variação do escopo, tabela → promoção, custo médio e margem de hoje,
 * pela prévia da API (o custo médio muda com as compras, então a margem é a atual, não a da criação).
 */
export function PromotionViewDialog({
  promotion,
  onClose,
}: {
  promotion: PromotionListItemDto | null;
  onClose: () => void;
}) {
  const { previewPromotion } = usePromotions();
  const [loaded, setLoaded] = useState<{
    id: string;
    preview: PromotionPreviewDto | null;
  } | null>(null);

  useEffect(() => {
    if (!promotion) return;
    let ignore = false;
    previewPromotion(
      promotion.productId,
      promotion.variantId,
      promotion.discountPercent
    )
      .then((preview) => !ignore && setLoaded({ id: promotion.id, preview }))
      .catch((error) => {
        if (ignore) return;
        setLoaded({ id: promotion.id, preview: null });
        handleError(error, "Erro ao carregar os preços da promoção");
      });
    return () => {
      ignore = true;
    };
  }, [promotion, previewPromotion]);

  const preview = loaded?.id === promotion?.id ? loaded?.preview : undefined;

  return (
    <Dialog
      open={promotion != null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {promotion && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {promotion.productName}
                <PromotionStatusBadge status={promotion.status} />
              </DialogTitle>
              <DialogDescription>
                {formatDateOnly(promotion.startDate)} a{" "}
                {formatDateOnly(promotion.endDate)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-baseline justify-between gap-4 rounded-xl border p-4">
              <span className="text-sm text-muted-foreground">Desconto</span>
              <span className="text-2xl font-semibold text-destructive tabular-nums">
                −{formatPercentage(promotion.discountPercent)}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Info
                label="Escopo"
                value={
                  promotion.variantId
                    ? `Variação ${promotion.variantLabel ?? "Padrão"}`
                    : "Todas as variações"
                }
              />
              <Info
                label="Origem"
                value={PROMOTION_SOURCE_LABELS[promotion.source]}
              />
              <Info label="Criada por" value={promotion.createdByName} />
              <Info label="Motivo" value={promotion.reason ?? "-"} />
            </dl>

            {promotion.belowCostConfirmed && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Abaixo do custo médio</AlertTitle>
                <AlertDescription>
                  O preço promocional ficou abaixo do custo e isso foi
                  confirmado na criação.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Preços por variação</span>
              {preview === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : preview == null ? (
                <span className="text-sm text-muted-foreground">
                  Não foi possível carregar os preços.
                </span>
              ) : (
                <div className="divide-y rounded-xl border">
                  {preview.variants.map((row) => (
                    <div
                      key={row.variantId}
                      className="flex items-center justify-between gap-3 p-3 text-sm"
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">
                          {row.variantLabel ?? "Padrão"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Custo médio{" "}
                          {row.averageCost != null
                            ? formatCurrency(row.averageCost)
                            : "-"}
                          {" · "}
                          Margem{" "}
                          {row.marginPercent != null
                            ? formatPercentage(row.marginPercent)
                            : "-"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs text-muted-foreground line-through tabular-nums">
                          {formatCurrency(row.listPrice)}
                        </span>
                        <span className="font-semibold text-primary tabular-nums">
                          {formatCurrency(row.promoPrice)}
                        </span>
                        {row.belowCost && (
                          <Badge variant="destructive">Abaixo do custo</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
