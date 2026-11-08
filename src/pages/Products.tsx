import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { ArchiveX, ImageOff, RotateCcw, Search } from "lucide-react";

import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useProducts } from "@/hooks/use-products";
import type { IIndexParams, IOption } from "@/interfaces/api.interface";
import type {
  ProductFormOptionsDto,
  ProductListItemDto,
} from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import {
  LIFECYCLE_LABELS,
  PRODUCT_TYPE_LABELS,
  TLifecycle,
  TProductType,
} from "@/types/enums";
import { formatNumber } from "@/utils/format.helpers";
import { formatPriceRange } from "@/utils/product.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type ProductFilters = {
  search: string;
  categoryId: string;
  productType: string;
  collectionId: string;
  lifecycle: string;
  isActive: string;
  lowStock: string;
};

const initialFilters: ProductFilters = {
  search: "",
  categoryId: "",
  productType: "",
  collectionId: "",
  lifecycle: "",
  isActive: "",
  lowStock: "",
};

const typeOptions: IOption[] = Object.values(TProductType).map((type) => ({
  value: type,
  label: PRODUCT_TYPE_LABELS[type],
}));
const lifecycleOptions: IOption[] = Object.values(TLifecycle).map(
  (lifecycle) => ({ value: lifecycle, label: LIFECYCLE_LABELS[lifecycle] })
);
const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];
const lowStockOptions: IOption[] = [
  { value: "true", label: "Só estoque baixo" },
];
const sortOptions: IOption[] = [
  { value: "name", label: "Nome" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "available-asc", label: "Menor disponível" },
  { value: "available-desc", label: "Maior disponível" },
];

function Products() {
  const navigate = useNavigate();
  const {
    products,
    pagination,
    searchProducts,
    getForm,
    deleteProduct,
    reactivateProduct,
    changeLifecycle,
  } = useProducts();
  const [options, setOptions] = useState<ProductFormOptionsDto>({
    categories: [],
    collections: [],
    events: [],
    suppliers: [],
    locations: [],
  });
  const [sort, setSort] = useState("name");
  const sortRef = useRef("name");
  // Disponível é da loja selecionada no topo; "Todas as lojas" (null) soma a empresa (contrato T1).
  const { storeId } = useCurrentStore();
  const storeIdRef = useRef(storeId);

  const search = useCallback(
    (query?: IIndexParams) => {
      const [field, direction] = sortRef.current.split("-");
      const filters = { ...query?.filters };
      if (storeIdRef.current) filters.storeId = storeIdRef.current;
      return searchProducts({
        ...query,
        filters,
        sort: field,
        order: direction === "desc" ? "desc" : "asc",
      });
    },
    [searchProducts]
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
  } = useIndexSearch<ProductFilters, "search">({
    search,
    initialFilters,
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar produtos"),
  });

  useEffect(() => {
    if (storeIdRef.current === storeId) return;
    storeIdRef.current = storeId;
    handleSearch(1);
  }, [storeId, handleSearch]);

  useEffect(() => {
    getForm()
      .then((form) => setOptions(form.options))
      .catch((error) => handleError(error, "Erro ao carregar os filtros"));
  }, [getForm]);

  const run = useCallback(
    async (action: () => Promise<void>, success: string) => {
      try {
        await action();
        handleSuccess(success);
        await handleSearch(1);
      } catch (error) {
        handleError(error);
      }
    },
    [handleSearch]
  );

  const columns = useMemo<ColumnDef<ProductListItemDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Produto",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
              {row.original.imageUrl ? (
                <img
                  src={row.original.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImageOff
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{row.original.name}</span>
              {row.original.brand && (
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.brand}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "productType",
        header: "Tipo",
        meta: { hideOnMobile: true },
        cell: ({ row }) => PRODUCT_TYPE_LABELS[row.original.productType],
      },
      {
        accessorKey: "categoryPath",
        header: "Categoria",
        meta: { hideOnMobile: true },
        cell: ({ row }) => row.original.categoryPath ?? "-",
      },
      {
        accessorKey: "variantCount",
        header: "Variações",
        meta: { hideOnMobile: true },
        cell: ({ row }) =>
          row.original.hasVariants ? row.original.variantCount : "Sem grade",
      },
      {
        id: "price",
        header: "Preço",
        // Preço efetivo já com a promoção vigente; o selo mostra o maior desconto (F2.3).
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>
              {formatPriceRange(
                row.original.minEffectivePrice,
                row.original.maxEffectivePrice
              )}
            </span>
            {row.original.activePromotionPercent != null && (
              <Badge variant="secondary">
                −{formatNumber(row.original.activePromotionPercent, 2)}%
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "availableQuantity",
        header: "Disponível",
        // Abaixo do mínimo efetivo em algum local da loja do topo (RN-CE33); o cálculo é da API.
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>
              {formatNumber(
                row.original.availableQuantity,
                row.original.decimalPlaces
              )}
            </span>
            {row.original.hasLowStock && (
              <Badge variant="destructive">Estoque baixo</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "lifecycle",
        header: "Ciclo de vida",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.lifecycle === TLifecycle.Active
                ? "default"
                : "secondary"
            }
          >
            {LIFECYCLE_LABELS[row.original.lifecycle]}
          </Badge>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const product = row.original;
          const discontinued = product.lifecycle === TLifecycle.Discontinued;
          return (
            <NavActionColumn
              object={product}
              onView={() => navigate(`/products/${product.id}/view`)}
              onEdit={() => navigate(`/products/${product.id}/edit`)}
              onDelete={() =>
                run(
                  () => deleteProduct(product.id),
                  "Produto inativado com sucesso"
                )
              }
              onReactivate={() =>
                run(
                  () => reactivateProduct(product.id),
                  "Produto reativado com sucesso"
                )
              }
              disableEdit={!product.isActive}
              disableDelete={!product.isActive}
              disableReactivate={product.isActive}
              deleteLabel="Inativar"
              deleteDialogTitle="Inativar este produto?"
              deleteDialogDescription="O produto não pode ser editado enquanto estiver inativo. Você pode reativá-lo depois."
              deleteButtonLabel="Inativar"
              extraActions={[
                {
                  label: discontinued
                    ? "Marcar em linha"
                    : "Marcar fora de linha",
                  icon: discontinued ? <RotateCcw /> : <ArchiveX />,
                  disabled: !product.isActive,
                  onClick: () =>
                    run(
                      () =>
                        changeLifecycle(
                          product.id,
                          discontinued
                            ? TLifecycle.Active
                            : TLifecycle.Discontinued
                        ),
                      "Ciclo de vida atualizado"
                    ),
                },
              ]}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, run, deleteProduct, reactivateProduct, changeLifecycle]
  );

  const filterSelect = (
    key: keyof ProductFilters,
    label: string,
    data: IOption[]
  ) => (
    <SearchSelect<IOption>
      field={{
        value: filters[key],
        onChange: (value) =>
          setFilters((prev) => ({
            ...prev,
            [key]: value ? String(value) : "",
          })),
      }}
      label={label}
      data={data}
      placeholder="Todos"
    />
  );

  return (
    <EntityIndexPage
      title="Produtos"
      onRowOpen={(product) => navigate(`/products/${product.id}/view`)}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      toolbar={
        <>
          <InputGroup className="w-full md:w-[320px]">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Nome, marca, SKU ou código de barras..."
              aria-label="Pesquisar produto"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre e ordene a listagem de produtos."
            onApply={() => {
              handleSearch(1);
              handleFiltersOpenChange(false);
            }}
            onClear={() => {
              resetFilters();
              sortRef.current = "name";
              setSort("name");
              handleSearch(1);
              handleFiltersOpenChange(false);
            }}
          >
            {filterSelect(
              "categoryId",
              "Categoria",
              options.categories.map((category) => ({
                value: category.id,
                label: category.path,
              }))
            )}
            {filterSelect("productType", "Tipo", typeOptions)}
            {filterSelect(
              "collectionId",
              "Coleção",
              options.collections.map((collection) => ({
                value: collection.value,
                label: collection.label,
              }))
            )}
            {filterSelect("lifecycle", "Ciclo de vida", lifecycleOptions)}
            {filterSelect("isActive", "Status", statusOptions)}
            {filterSelect("lowStock", "Estoque", lowStockOptions)}
            <SearchSelect<IOption>
              field={{
                value: sort,
                onChange: (value) => {
                  const next = value ? String(value) : "name";
                  sortRef.current = next;
                  setSort(next);
                },
              }}
              label="Ordenar por"
              data={sortOptions}
            />
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={products}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={() => navigate("/products/create")}
    />
  );
}

export default function ProductsPageWrapper() {
  return (
    <ProductsProvider>
      <Products />
    </ProductsProvider>
  );
}
