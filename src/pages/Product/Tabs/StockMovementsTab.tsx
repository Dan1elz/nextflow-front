import { useState, useEffect, useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { StockMovementDrawer } from "@/components/app/stock-movement-drawer";
import { StockMovementsProvider } from "@/providers/stock-movements.provider";
import { ProductsProvider } from "@/providers/products.provider";
import { useStockMovements } from "@/hooks/use-stock-movements";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatDateTime, formatNumber, formatCurrency } from "@/utils";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";
import { MOVEMENT_TYPE_LABELS, TMovementType as TypesObj } from "@/types/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";

type StockMovementsTabProps = {
  productId: string | null;
  productName?: string;
  disabled?: boolean;
};

function StockMovementsTabContent({
  productId,
  productName,
  disabled = false,
}: StockMovementsTabProps) {
  const {
    stockMovements,
    pagination,
    searchStockMovements,
    deleteStockMovement,
  } = useStockMovements();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<IStockMovement | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [, setSelectedIds] = useState<string[]>([]);

  const fetchMovements = useCallback(
    (page = 1) => {
      if (!productId) return;
      searchStockMovements({
        filters: { productId },
        page,
        perPage: 10,
      }).catch((err) => {
        handleError(err, "Erro ao buscar movimentações");
      });
    },
    [productId, searchStockMovements]
  );

  useEffect(() => {
    if (!productId) return;
    fetchMovements(1);
  }, [productId, fetchMovements]);

  const handleCreate = () => {
    setSelectedMovement(null);
    setIsViewing(false);
    setIsDrawerOpen(true);
  };

  const handleView = useCallback((sm: IStockMovement) => {
    setSelectedMovement(sm);
    setIsViewing(true);
    setIsDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (sm: IStockMovement) => {
      if (!sm.id) return;
      try {
        await deleteStockMovement(sm.id);
        handleSuccess("Movimentação excluída com sucesso");
        fetchMovements(1);
      } catch (error) {
        handleError(error, "Erro ao excluir movimentação");
      }
    },
    [deleteStockMovement, fetchMovements]
  );

  const columns = useMemo<ColumnDef<IStockMovement>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const isAllSelected = table.getIsAllPageRowsSelected();
          const isSomeSelected = table.getIsSomePageRowsSelected();
          return (
            <Checkbox
              checked={isAllSelected}
              indeterminate={isSomeSelected && !isAllSelected}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Selecionar todos"
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
          />
        ),
        enableSorting: false,
        enableHiding: false,
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
        accessorKey: "movementType",
        header: "Tipo",
        cell: ({ row }) => {
          const mType = row.original.movementType as unknown as TypesObj;
          const label = MOVEMENT_TYPE_LABELS[mType] ?? String(mType);

          let variant: "default" | "destructive" | "outline" | "secondary" =
            "default";
          let extraClass = "";

          if (mType === TypesObj.Entry) {
            extraClass = "bg-green-600 hover:bg-green-700 text-white";
          } else if (mType === TypesObj.Exit) {
            variant = "destructive";
          } else if (mType === TypesObj.Adjustment) {
            extraClass = "bg-yellow-500 hover:bg-yellow-600 text-white";
          }

          return (
            <Badge
              variant={variant}
              className={`w-20 justify-center text-center ${extraClass}`}
            >
              {label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Quantidade",
        cell: ({ row }) => formatNumber(Number(row.original.quantity)),
      },
      {
        accessorKey: "quote",
        header: "Cotação",
        cell: ({ row }) =>
          row.original.quote ? formatCurrency(Number(row.original.quote)) : "-",
      },
      {
        accessorKey: "createAt",
        header: "Data / Hora",
        cell: ({ row }) =>
          row.original.createAt ? formatDateTime(row.original.createAt) : "-",
      },
      ...(disabled
        ? []
        : [
            {
              id: "actions",
              header: "Ações",
              cell: ({ row }: { row: { original: IStockMovement } }) => {
                const movementType = row.original
                  .movementType as unknown as TypesObj;
                const allowedToDelete = [
                  TypesObj.Entry,
                  TypesObj.Exit,
                  TypesObj.Adjustment,
                ];
                const canDelete = (allowedToDelete as number[]).includes(
                  movementType
                );

                return (
                  <NavActionColumn
                    object={row.original}
                    disableEdit={true}
                    onDelete={handleDelete}
                    onView={handleView}
                    disableDelete={!canDelete}
                  />
                );
              },
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<IStockMovement>,
          ]),
    ],
    [disabled, handleDelete, handleView]
  );

  if (!productId) {
    return (
      <p className="text-muted-foreground text-sm">
        Salve o produto antes de gerenciar movimentações de estoque.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleCreate} aria-label="Nova Movimentação">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Nova Movimentação</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={stockMovements}
          page={pagination?.currentPage ?? 1}
          totalPages={pagination?.lastPage ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={fetchMovements}
          onSelectionChange={setSelectedIds}
        />
      </div>

      <StockMovementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        stockMovement={selectedMovement}
        isViewing={isViewing}
        onSuccess={() => fetchMovements(1)}
        productId={productId}
        productName={productName}
        hideProduct
      />
    </div>
  );
}

export function StockMovementsTab(props: StockMovementsTabProps) {
  return (
    <ProductsProvider>
      <StockMovementsProvider>
        <StockMovementsTabContent {...props} />
      </StockMovementsProvider>
    </ProductsProvider>
  );
}
