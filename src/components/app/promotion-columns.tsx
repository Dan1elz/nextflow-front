import type { ColumnDef } from "@tanstack/react-table";

import { NavActionColumn } from "@/components/app/nav-action-column";
import { PromotionStatusBadge } from "@/components/app/promotion-status-badge";
import { Badge } from "@/components/ui/badge";
import type { PromotionListItemDto } from "@/interfaces/promotion.interface";
import { PROMOTION_SOURCE_LABELS, TPromotionStatus } from "@/types/enums";
import { formatDateOnly, formatPercentage } from "@/utils/format.helpers";
import { formatPriceRange } from "@/utils/product.helpers";

const canCancel = (promotion: PromotionListItemDto) =>
  promotion.status === TPromotionStatus.Scheduled ||
  promotion.status === TPromotionStatus.Active;

const productColumn: ColumnDef<PromotionListItemDto> = {
  accessorKey: "productName",
  header: "Produto",
};

/** Colunas do T-VD7, na tela `/promotions` e na aba Promoções do T3 (sem a coluna do produto). */
export function buildPromotionColumns(
  onCancel: (promotion: PromotionListItemDto) => void,
  showProduct = true,
  actions: {
    onView?: (promotion: PromotionListItemDto) => void;
    /** Só a agendada se edita (a vigente já mudou preço de venda). */
    onEdit?: (promotion: PromotionListItemDto) => void;
  } = {}
): ColumnDef<PromotionListItemDto>[] {
  return [
    ...(showProduct ? [productColumn] : []),
    {
      accessorKey: "variantLabel",
      header: "Variação",
      cell: ({ row }) =>
        row.original.variantId
          ? (row.original.variantLabel ?? "Padrão")
          : "Todas",
    },
    {
      accessorKey: "discountPercent",
      header: "Desconto",
      cell: ({ row }) => formatPercentage(row.original.discountPercent),
    },
    {
      id: "prices",
      header: "Tabela → promoção",
      cell: ({ row }) =>
        `${formatPriceRange(row.original.minListPrice, row.original.maxListPrice)} → ${formatPriceRange(
          row.original.minPromoPrice,
          row.original.maxPromoPrice
        )}`,
    },
    {
      id: "period",
      header: "Período",
      cell: ({ row }) =>
        `${formatDateOnly(row.original.startDate)} a ${formatDateOnly(row.original.endDate)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <PromotionStatusBadge status={row.original.status} />
          {row.original.belowCostConfirmed && (
            <Badge variant="destructive">Abaixo do custo</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "source",
      header: "Origem",
      meta: { hideOnMobile: true },
      cell: ({ row }) => PROMOTION_SOURCE_LABELS[row.original.source],
    },
    {
      accessorKey: "createdByName",
      header: "Criada por",
      meta: { hideOnMobile: true },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <NavActionColumn
          object={row.original}
          onDelete={onCancel}
          onView={actions.onView}
          onEdit={actions.onEdit}
          disableView={!actions.onView}
          disableEdit={
            !actions.onEdit ||
            row.original.status !== TPromotionStatus.Scheduled
          }
          disableDelete={!canCancel(row.original)}
          disableReactivate
          deleteLabel="Cancelar"
          deleteDialogTitle="Cancelar esta promoção?"
          deleteDialogDescription="O preço volta ao de tabela a partir de agora. A promoção fica no histórico como cancelada e não pode ser reativada."
          deleteButtonLabel="Cancelar promoção"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
