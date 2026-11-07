import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { PurchaseStatusBadge } from "@/components/app/purchase-status-badge";
import { useAuth } from "@/hooks/use-auth";
import type { PaginationDto } from "@/interfaces/api.interface";
import type { PurchaseOrderListItemDto } from "@/interfaces/purchase-order.interface";
import { purchaseOrderService } from "@/services/purchase-order.service";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
} from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

/**
 * Aba Compras do fornecedor: os pedidos de compra dele em todas as lojas, do mais novo ao mais antigo. A linha abre o
 * pedido.
 */
export function SupplierPurchasesTab({ supplierId }: { supplierId: string }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [result, setResult] =
    useState<PaginationDto<PurchaseOrderListItemDto> | null>(null);

  useEffect(() => {
    let active = true;
    purchaseOrderService
      .getAll(
        { page, perPage, filters: { supplierId } },
        null,
        token ?? undefined
      )
      .then((data) => active && setResult(data))
      .catch((error) => handleError(error, "Erro ao buscar compras"));
    return () => {
      active = false;
    };
  }, [supplierId, page, perPage, token]);

  const columns = useMemo<ColumnDef<PurchaseOrderListItemDto>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Nº",
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium underline-offset-4 hover:underline"
            onClick={() => navigate(`/purchase-orders/${row.original.id}/view`)}
          >
            {row.original.number}
          </button>
        ),
      },
      {
        accessorKey: "storeName",
        header: "Entrega",
        cell: ({ row }) =>
          `${row.original.storeName} › ${row.original.receiveLocationName}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <PurchaseStatusBadge
            status={row.original.status}
            isLate={row.original.isLate}
          />
        ),
      },
      { accessorKey: "itemCount", header: "Itens" },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "sentAt",
        header: "Enviado",
        cell: ({ row }) =>
          row.original.sentAt ? formatDateTime(row.original.sentAt) : "-",
      },
      {
        accessorKey: "expectedOn",
        header: "Previsão",
        cell: ({ row }) =>
          row.original.expectedOn
            ? formatDateOnly(row.original.expectedOn)
            : "-",
      },
      {
        accessorKey: "receivedAt",
        header: "Recebido",
        cell: ({ row }) =>
          row.original.receivedAt
            ? `${formatDateTime(row.original.receivedAt)} (${row.original.realLeadTimeDays ?? 0} dia(s))`
            : "-",
      },
    ],
    [navigate]
  );

  const total = result?.total ?? 0;
  return (
    <DataTable
      columns={columns}
      data={result?.items ?? []}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / perPage))}
      total={total}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={(value) => {
        setPerPage(value);
        setPage(1);
      }}
    />
  );
}
