import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/app/data-table";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useStockMovements } from "@/hooks/use-stock-movements";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";
import { StockMovementsProvider } from "@/providers/stock-movements.provider";
import { formatCurrency, formatDateOnly, formatNumber } from "@/utils";
import { MOVEMENT_TYPE_LABELS, type TMovementType } from "@/types/enums";
import { NavActionColumn } from "@/components/app/nav-action-column";

function StockMovements() {
  const {
    stockMovements,
    pagination,
    searchStockMovements,
    deleteStockMovement,
  } = useStockMovements();
  const [perPage, setPerPage] = useState(10);
  const hasSearched = useRef(false);

  const searchStockMovementsRef = useRef(searchStockMovements);
  const perPageRef = useRef(perPage);

  useEffect(() => {
    searchStockMovementsRef.current = searchStockMovements;
  }, [searchStockMovements]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const handleSearch = useCallback((page = 1) => {
    searchStockMovementsRef
      .current({
        filters: {},
        page,
        perPage: perPageRef.current,
      })
      .catch((error) => {
        handleError(error, "Erro ao buscar movimentações");
      });
  }, []);

  const handlePageChange = (page: number) => handleSearch(page);

  const handleDelete = useCallback(
    async (sm: IStockMovement) => {
      if (!sm.id) return;
      try {
        await deleteStockMovement(sm.id);
        handleSuccess("Movimentação de estoque excluída");
        handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir movimentação");
      }
    },
    [deleteStockMovement, handleSearch]
  );

  // Como o usuário pediu para apenas listar neste momento, usaremos hooks mockados ou apenas visualização
  const handleEdit = useCallback(() => {
    /* Funcionalidade futura */
  }, []);
  const handleView = useCallback(() => {
    /* Funcionalidade futura */
  }, []);

  useEffect(() => {
    if (hasSearched.current) {
      searchStockMovementsRef
        .current({
          filters: {},
          page: 1,
          perPage,
        })
        .catch((error) => handleError(error, "Erro desconhecido"));
    } else {
      hasSearched.current = true;
      handleSearch(1);
    }
  }, [perPage, handleSearch]);

  const columns = useMemo<ColumnDef<IStockMovement>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) =>
          row.original.createdAt ? formatDateOnly(row.original.createdAt) : "-",
      },
      {
        id: "product",
        header: "Produto",
        cell: ({ row }) => row.original.product?.name ?? "-",
      },
      {
        accessorKey: "movementType",
        header: "Tipo",
        cell: ({ row }) =>
          MOVEMENT_TYPE_LABELS[row.original.movementType as TMovementType] ??
          String(row.original.movementType),
      },
      {
        accessorKey: "quantity",
        header: "Quantidade",
        cell: ({ row }) => formatNumber(Number(row.original.quantity)),
      },
      {
        accessorKey: "quote",
        header: "Cotação",
        cell: ({ row }) => formatCurrency(Number(row.original.quote)),
      },
      {
        accessorKey: "description",
        header: "Descrição",
        cell: ({ row }) => row.original.description || "-",
      },
      {
        id: "user",
        header: "Usuário",
        cell: ({ row }) =>
          row.original.user
            ? `${row.original.user.name} ${row.original.user.lastName}`
            : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleView]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Movimentações de Estoque</CardTitle>
            </div>
            {/* Botões de Ações Gerais seriam colocados aqui, como filtro, novo, etc. */}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={stockMovements}
            page={pagination?.currentPage ?? 1}
            totalPages={pagination?.lastPage ?? 1}
            total={pagination?.total ?? 0}
            onPageChange={handlePageChange}
            onPerPageChange={setPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function StockMovementsPageWrapper() {
  return (
    <StockMovementsProvider>
      <StockMovements />
    </StockMovementsProvider>
  );
}
