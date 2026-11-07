import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";

import { DatePicker } from "@/components/app/date-picker";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { SearchSelect } from "@/components/app/search-select";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useStockMovements } from "@/hooks/use-stock-movements";
import type { IIndexParams, IOption } from "@/interfaces/api.interface";
import type { StockMovementListItemDto } from "@/interfaces/stock-movement.interface";
import { StockMovementsProvider } from "@/providers/stock-movements.provider";
import {
  MOVEMENT_REASON_LABELS,
  SOURCE_TYPE_LABELS,
  TMovementReason,
  TMovementType,
  TSourceType,
} from "@/types/enums";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

type MovementFilters = {
  locationId: string;
  productId: string;
  variantId: string;
  reason: string;
  sourceType: string;
  from: string;
  to: string;
};

const reasonOptions: IOption[] = Object.values(TMovementReason).map(
  (reason) => ({ value: reason, label: MOVEMENT_REASON_LABELS[reason] })
);
const sourceOptions: IOption[] = Object.values(TSourceType).map((source) => ({
  value: source,
  label: SOURCE_TYPE_LABELS[source],
}));

/** Quantidades do kardex: até 3 casas, sem zeros sobrando ("12", "2,5"). */
const formatQuantity = (value: number) =>
  Number.isInteger(value)
    ? formatNumber(value, 0)
    : formatNumber(value, 3).replace(/0+$/, "").replace(/,$/, "");

const signed = (value: number) =>
  value > 0 ? `+${formatQuantity(value)}` : formatQuantity(value);

/** T8: kardex somente leitura, mais recente primeiro. Correção é um lançamento contrário (RN-CE14). */
function StockMovements() {
  const {
    stockMovements,
    pagination,
    searchStockMovements,
    getLocationOptions,
    searchProductOptions,
    getVariantOptions,
  } = useStockMovements();
  const [params] = useSearchParams();
  // A aba Estoque do T3 abre o kardex já filtrado pelo produto (e variação, quando houver).
  const initialFilters = useMemo<MovementFilters>(
    () => ({
      locationId: params.get("locationId") ?? "",
      productId: params.get("productId") ?? "",
      variantId: params.get("variantId") ?? "",
      reason: "",
      sourceType: "",
      from: "",
      to: "",
    }),
    // Só o primeiro valor da URL vale; depois o filtro é da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [locations, setLocations] = useState<IOption[]>([]);
  const [products, setProducts] = useState<IOption[]>([]);
  const [variants, setVariants] = useState<IOption[]>([]);

  // Filtro padrão é a loja do topo; "Todas as lojas" (null) mostra a empresa inteira.
  const { storeId } = useCurrentStore();
  const storeIdRef = useRef(storeId);

  const search = useCallback(
    (query?: IIndexParams) => {
      const filters = { ...query?.filters };
      if (storeIdRef.current) filters.storeId = storeIdRef.current;
      return searchStockMovements({ ...query, filters });
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
  } = useIndexSearch<MovementFilters, "locationId">({
    search,
    initialFilters,
    quickSearchKey: "locationId",
    perPageInitial: 20,
    debounceMs: 0,
    onError: (error) => handleError(error, "Erro ao buscar movimentações"),
  });

  useEffect(() => {
    getLocationOptions(undefined, storeId)
      .then((options) =>
        setLocations(
          options.map((location) => ({
            value: location.id,
            label: storeId
              ? location.name
              : `${location.storeName} › ${location.name}`,
          }))
        )
      )
      .catch((error) => handleError(error, "Erro ao carregar os locais"));
    if (storeIdRef.current === storeId) return;
    storeIdRef.current = storeId;
    // O local escolhido pode ser de outra loja: volta para "todos" e busca de novo.
    setFilters((prev) => ({ ...prev, locationId: "" }));
    handleSearch(1);
  }, [storeId, getLocationOptions, setFilters, handleSearch]);

  useEffect(() => {
    searchProductOptions("")
      .then(setProducts)
      .catch((error) => handleError(error, "Erro ao carregar os produtos"));
  }, [searchProductOptions]);

  useEffect(() => {
    if (!filters.productId) {
      setVariants([]);
      return;
    }
    getVariantOptions(filters.productId)
      .then(setVariants)
      .catch((error) => handleError(error, "Erro ao carregar as variações"));
  }, [filters.productId, getVariantOptions]);

  const setFilter = (key: keyof MovementFilters, value: string) =>
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Trocar o produto limpa a variação, que é dele.
      ...(key === "productId" ? { variantId: "" } : {}),
    }));

  const columns = useMemo<ColumnDef<StockMovementListItemDto>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        accessorKey: "productName",
        header: "Produto",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <Link
              to={`/products/${row.original.productId}/view`}
              className="truncate font-medium underline-offset-4 hover:underline"
            >
              {row.original.productName}
            </Link>
            {row.original.variantLabel && (
              <span className="truncate text-xs text-muted-foreground">
                {row.original.variantLabel}
              </span>
            )}
          </div>
        ),
      },
      { accessorKey: "locationName", header: "Local" },
      {
        accessorKey: "lotCode",
        header: "Lote",
        cell: ({ row }) => row.original.lotCode ?? "-",
      },
      {
        accessorKey: "reason",
        header: "Motivo",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.type === TMovementType.In ? "default" : "secondary"
            }
          >
            {MOVEMENT_REASON_LABELS[row.original.reason]}
          </Badge>
        ),
      },
      {
        accessorKey: "quantity",
        header: () => <span className="block text-right">Quantidade</span>,
        cell: ({ row }) => (
          <span
            className={
              row.original.quantity < 0
                ? "block text-right text-destructive"
                : "block text-right"
            }
          >
            {signed(row.original.quantity)}
          </span>
        ),
      },
      {
        accessorKey: "unitCost",
        header: () => <span className="block text-right">Custo unit.</span>,
        cell: ({ row }) => (
          <span className="block text-right">
            {row.original.unitCost == null
              ? "-"
              : formatCurrency(row.original.unitCost)}
          </span>
        ),
      },
      {
        accessorKey: "balanceAfter",
        header: () => <span className="block text-right">Saldo após</span>,
        cell: ({ row }) => (
          <span className="block text-right font-medium">
            {formatQuantity(row.original.balanceAfter)}
          </span>
        ),
      },
      {
        id: "source",
        header: "Origem",
        cell: ({ row }) =>
          row.original.source
            ? `${SOURCE_TYPE_LABELS[row.original.source.type]}${
                row.original.source.number
                  ? ` nº ${row.original.source.number}`
                  : ""
              }`
            : "Manual",
      },
      { accessorKey: "userName", header: "Usuário" },
      {
        accessorKey: "note",
        header: "Observação",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-64 text-muted-foreground">
            {row.original.note ?? "-"}
          </span>
        ),
      },
    ],
    []
  );

  const select = (
    key: keyof MovementFilters,
    label: string | undefined,
    data: IOption[],
    placeholder = "Todos"
  ) => (
    <SearchSelect<IOption>
      field={{
        value: filters[key],
        onChange: (value) => setFilter(key, value ? String(value) : ""),
      }}
      label={label}
      data={data}
      placeholder={placeholder}
    />
  );

  return (
    <EntityIndexPage
      title="Movimentações"
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      toolbar={
        <>
          <div className="w-full md:w-[280px]">
            {select("locationId", undefined, locations, "Todos os locais")}
          </div>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre o kardex por período, produto, motivo e origem."
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
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>De</FieldLabel>
                <DatePicker
                  value={filters.from}
                  onChange={(value) => setFilter("from", value)}
                />
              </Field>
              <Field>
                <FieldLabel>Até</FieldLabel>
                <DatePicker
                  value={filters.to}
                  onChange={(value) => setFilter("to", value)}
                />
              </Field>
            </div>
            <SearchSelect<IOption>
              field={{
                value: filters.productId,
                onChange: (value) =>
                  setFilter("productId", value ? String(value) : ""),
              }}
              label="Produto"
              data={products}
              placeholder="Todos"
              onSearch={searchProductOptions}
            />
            {filters.productId &&
              variants.length > 1 &&
              select("variantId", "Variação", variants, "Todas")}
            {select("reason", "Motivo", reasonOptions)}
            {select("sourceType", "Origem", sourceOptions, "Todas")}
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={stockMovements}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
    />
  );
}

export default function StockMovementsPageWrapper() {
  return (
    <StockMovementsProvider>
      <StockMovements />
    </StockMovementsProvider>
  );
}
