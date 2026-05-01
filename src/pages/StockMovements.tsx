import { useMemo, useCallback, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";

import { StockMovementDrawer } from "@/components/app/stock-movement-drawer";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatDateTime, formatNumber, formatCurrency } from "@/utils";
import { useStockMovements } from "@/hooks/use-stock-movements";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSearchOptions } from "@/hooks/use-search-options";
import type { IStockMovement } from "@/interfaces/stock-movement.interface";
import type { IProduct } from "@/interfaces/product.interface";
import type { IUser } from "@/interfaces/user.interface";
import { StockMovementsProvider } from "@/providers/stock-movements.provider";
import { ProductsProvider } from "@/providers/products.provider";
import { UsersProvider } from "@/providers/users.provider";
import {
  MOVEMENT_TYPE_LABELS,
  type TMovementType,
  TMovementType as TypesObj,
} from "@/types/enums";
import { useProducts } from "@/hooks/use-products";
import { useUsers } from "@/hooks/use-users";
import { Badge } from "@/components/ui/badge";
import type { IOption } from "@/interfaces/api.interface";

type StockMovementFilters = {
  search: string;
  productId: string;
  userId: string;
  movementType: string;
  createAt: string;
};

function StockMovements() {
  const {
    stockMovements,
    pagination,
    searchStockMovements,
    deleteStockMovement,
  } = useStockMovements();
  const { searchProductsForOptions, getProductById } = useProducts();
  const { searchUsersForOptions, getUserById } = useUsers();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<IStockMovement | null>(null);
  const [isViewing, setIsViewing] = useState(false);

  // Função adaptada para customizar quais filtros enviamos para a API
  const customSearch = useCallback(
    async (params?: import("@/interfaces/api.interface").IIndexParams) => {
      // Cria uma cópia dos filtros para remover/ajustar o que for necessário
      const activeFilters = { ...params?.filters } as Record<string, string>;

      // Se movementType for ALL, não enviamos como filtro
      if (activeFilters.movementType === "ALL") {
        delete activeFilters.movementType;
      }

      await searchStockMovements({
        ...params,
        filters: activeFilters,
      });
    },
    [searchStockMovements]
  );

  const {
    setPerPage,
    selectedIds,
    setSelectedIds,
    filters,
    setFilters,
    resetFilters,
    isFiltersOpen,
    handleFiltersOpenChange,
    handleSearch,
    handlePageChange,
  } = useIndexSearch<StockMovementFilters, "search">({
    search: customSearch,
    initialFilters: {
      search: "",
      productId: "",
      userId: "",
      movementType: "ALL",
      createAt: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro ao buscar movimentações");
    },
  });

  const { options: productOptions, handleSearch: handleSearchProducts } =
    useSearchOptions<IProduct>({
      searchFn: async (params) => {
        return await searchProductsForOptions(params);
      },
      mapFn: (product) => ({
        value: product.id ?? "",
        label: product.name,
      }),
      selectFn: async (id) => {
        return await getProductById(id);
      },
      errorLabel: "produtos",
      autoLoad: false,
      perPage: 50,
    });

  const { options: userOptions, handleSearch: handleSearchUsers } =
    useSearchOptions<IUser>({
      searchFn: async (params) => {
        return await searchUsersForOptions(params);
      },
      mapFn: (user) => ({
        value: user.id ?? "",
        label: `${user.name} ${user.lastName}`,
      }),
      selectFn: async (id) => {
        return await getUserById(id);
      },
      errorLabel: "usuários",
      autoLoad: false,
      perPage: 50,
    });

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
        handleSuccess("Movimentação de estoque excluída com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir movimentação");
      }
    },
    [deleteStockMovement, handleSearch]
  );

  const handleExport = useCallback(() => {
    // Função vazia (mock)
  }, []);

  const handleDeleteMultiple = useCallback(() => {
    // Função vazia (mock)
  }, []);

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
        id: "product",
        header: "Produto",
        cell: ({ row }) => row.original.product?.name ?? "-",
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

          let variant: "default" | "destructive" | "outline" | "secondary" = "default";
          let extraClass = "";

          if (mType === TypesObj.Entry) {
            extraClass = "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm";
          } else if (mType === TypesObj.Exit) {
            extraClass = "bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm";
          } else if (mType === TypesObj.Sales) {
            extraClass = "bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-sm";
          } else if (mType === TypesObj.Return) {
            extraClass = "bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm";
          } else if (mType === TypesObj.Adjustment) {
            extraClass = "bg-amber-400 hover:bg-amber-500 text-black border-none shadow-sm";
          }

          return (
            <Badge
              variant={variant}
              className={`w-20 justify-center text-center font-semibold ${extraClass}`}
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
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const movementType = row.original.movementType as unknown as TypesObj;
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
      },
    ],
    [handleDelete, handleView]
  );

  return (
    <>
      <EntityIndexPage
        title="Movimentações de Estoque"
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <InputGroup className="w-full md:w-[280px]">
              <InputGroupAddon>
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Pesquisar movimentação..."
                aria-label="Pesquisar"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre a listagem de movimentações."
              onApply={() => {
                handleSearch(1);
                handleFiltersOpenChange(false);
              }}
              onClear={() => {
                resetFilters();
                handleSearch(1);
                handleFiltersOpenChange(false);
              }}
            >
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <SearchSelect<IOption>
                    field={{
                      value: filters.productId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          productId: value ? String(value) : "",
                        })),
                    }}
                    data={productOptions}
                    onSearch={handleSearchProducts}
                    placeholder="Selecione um produto..."
                    label="Produto"
                  />
                </div>

                <div className="grid gap-2">
                  <SearchSelect<IOption>
                    field={{
                      value: filters.userId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          userId: value ? String(value) : "",
                        })),
                    }}
                    data={userOptions}
                    onSearch={handleSearchUsers}
                    placeholder="Selecione um usuário..."
                    label="Usuário"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={filters.movementType}
                    onValueChange={(val) =>
                      setFilters((prev) => ({ ...prev, movementType: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {(
                        Object.keys(TypesObj) as Array<keyof typeof TypesObj>
                      ).map((key) => {
                        const type = TypesObj[key];
                        return (
                          <SelectItem key={type} value={String(type)}>
                            {MOVEMENT_TYPE_LABELS[type as TMovementType]}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dateFilter">Data</Label>
                  <Input
                    id="dateFilter"
                    type="date"
                    value={filters.createAt}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        createAt: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={stockMovements}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={handleCreate}
        onExport={handleExport}
        onDeleteMultiple={handleDeleteMultiple}
      />
      <StockMovementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        stockMovement={selectedMovement}
        isViewing={isViewing}
        onSuccess={() => handleSearch(1)}
      />
    </>
  );
}

export default function StockMovementsPageWrapper() {
  return (
    <ProductsProvider>
      <UsersProvider>
        <StockMovementsProvider>
          <StockMovements />
        </StockMovementsProvider>
      </UsersProvider>
    </ProductsProvider>
  );
}
