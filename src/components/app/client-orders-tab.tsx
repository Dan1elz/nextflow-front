import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { OrderStatusBadge } from "@/components/app/order-status-badge";
import { useAuth } from "@/hooks/use-auth";
import type { PaginationDto } from "@/interfaces/api.interface";
import type { OrderListItemDto } from "@/interfaces/quick-sale.interface";
import { salesHistoryService } from "@/services/sales-history.service";
import { PAYMENT_METHOD_LABELS } from "@/types/enums";
import { formatCurrency, formatDateTime } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

/** Aba Compras do cliente: as vendas feitas para ele em todas as lojas, da mais nova à mais antiga. */
export function ClientOrdersTab({ clientId }: { clientId: string }) {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [result, setResult] = useState<PaginationDto<OrderListItemDto> | null>(
    null
  );

  useEffect(() => {
    let active = true;
    salesHistoryService
      .getAll(
        { page, perPage, filters: { clientId } },
        null,
        token ?? undefined
      )
      .then((data) => active && setResult(data))
      .catch((error) =>
        handleError(error, "Erro ao buscar compras do cliente")
      );
    return () => {
      active = false;
    };
  }, [clientId, page, perPage, token]);

  const columns = useMemo<ColumnDef<OrderListItemDto>[]>(
    () => [
      { accessorKey: "number", header: "Nº" },
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) =>
          formatDateTime(row.original.paidAt ?? row.original.createdAt),
      },
      { accessorKey: "storeName", header: "Loja" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      { accessorKey: "itemCount", header: "Itens" },
      {
        accessorKey: "paymentMethods",
        header: "Pagamento",
        cell: ({ row }) =>
          row.original.paymentMethods.length > 0
            ? row.original.paymentMethods
                .map((method) => PAYMENT_METHOD_LABELS[method])
                .join(", ")
            : "-",
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
    ],
    []
  );

  const total = result?.total ?? 0;
  return (
    <DataTable
      columns={columns}
      data={result?.items ?? []}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / perPage))}
      total={total}
      onPageChange={setPage}
      onPerPageChange={(value) => {
        setPerPage(value);
        setPage(1);
      }}
    />
  );
}
