import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, TicketPercent } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { buildPromotionColumns } from "@/components/app/promotion-columns";
import { PromotionCreateDialog } from "@/components/app/promotion-create-dialog";
import { PromotionViewDialog } from "@/components/app/promotion-view-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { usePromotions } from "@/hooks/use-promotions";
import type { PromotionListItemDto } from "@/interfaces/promotion.interface";
import { PromotionsProvider } from "@/providers/promotions.provider";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

interface ProductPromotionsTabProps {
  product: { id: string; name: string; isActive: boolean };
  /** Depois de criar ou cancelar: o preço efetivo do cabeçalho e das variações muda. */
  onChanged: () => void;
}

const PER_PAGE = 10;

function PromotionsTab({ product, onChanged }: ProductPromotionsTabProps) {
  const { promotions, pagination, searchPromotions, cancelPromotion } =
    usePromotions();
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<PromotionListItemDto | null>(null);
  const [viewing, setViewing] = useState<PromotionListItemDto | null>(null);

  const load = useCallback(
    (page = 1) =>
      searchPromotions({
        page,
        perPage: PER_PAGE,
        filters: { productId: product.id },
      }).catch((error) => handleError(error, "Erro ao buscar promoções")),
    [product.id, searchPromotions]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = useCallback(
    async (promotion: PromotionListItemDto) => {
      try {
        await cancelPromotion(promotion.id);
        handleSuccess("Promoção cancelada");
        await load();
        onChanged();
      } catch (error) {
        handleError(error, "Erro ao cancelar a promoção");
      }
    },
    [cancelPromotion, load, onChanged]
  );

  const columns = useMemo(
    () =>
      buildPromotionColumns(handleCancel, false, {
        onView: setViewing,
        onEdit: setEditing,
      }),
    [handleCancel]
  );

  return (
    <div className="flex flex-col gap-4">
      {product.isActive && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(true)}>
            <Plus data-icon="inline-start" />
            Nova promoção
          </Button>
        </div>
      )}
      {promotions.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TicketPercent />
            </EmptyMedia>
            <EmptyTitle>Sem promoções</EmptyTitle>
            <EmptyDescription>
              Este produto ainda não teve promoção.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={promotions}
          page={pagination?.currentPage ?? 1}
          totalPages={pagination?.lastPage ?? 1}
          total={pagination?.total}
          perPage={PER_PAGE}
          onPageChange={load}
        />
      )}
      <PromotionCreateDialog
        open={isCreating || editing != null}
        onOpenChange={(open) => {
          if (open) return;
          setIsCreating(false);
          setEditing(null);
        }}
        fixedProduct={product}
        promotion={editing}
        onCreated={() => {
          load();
          onChanged();
        }}
      />
      <PromotionViewDialog
        promotion={viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  );
}

/** Aba Promoções do T3: o T-VD7 filtrado pelo produto (F2.3). */
export function ProductPromotionsTab(props: ProductPromotionsTabProps) {
  return (
    <PromotionsProvider>
      <PromotionsTab {...props} />
    </PromotionsProvider>
  );
}
