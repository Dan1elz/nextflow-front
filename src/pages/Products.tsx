import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatCurrency, formatDateOnly, formatNumber } from "@/utils";
import { useProducts } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSearchOptions } from "@/hooks/use-search-options";
import type { IProduct } from "@/interfaces/product.interface";
import type { ISupplier } from "@/interfaces/supplier.interface";
import type { ICategory } from "@/interfaces/category.interface";
import type { IOption } from "@/interfaces/api.interface";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";
import {
  UNIT_TYPE_LABELS,
  TUnitType,
  type TUnitType as TUnitTypeAlias,
} from "@/types/enums";

type ProductFilters = {
  search: string;
  productCode: string;
  name: string;
  supplierId: string;
  categoryId: string;
  unitType: string;
  priceMin: string;
  priceMax: string;
  quantityMin: string;
  quantityMax: string;
  validity: string;
};

function Products() {
  const navigate = useNavigate();
  const { products, pagination, searchProducts, deleteProduct } = useProducts();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();
  const { searchCategoriesForOptions, getCategoryById } = useCategories();

  // Busca customizada para filtros
  const customSearch = useCallback(
    async (params?: import("@/interfaces/api.interface").IIndexParams) => {
      const activeFilters = { ...params?.filters } as Record<string, string>;

      if (activeFilters.unitType === "ALL") {
        delete activeFilters.unitType;
      }

      await searchProducts({
        ...params,
        filters: activeFilters,
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
    search: customSearch,
    initialFilters: {
      search: "",
      productCode: "",
      name: "",
      supplierId: "",
      categoryId: "",
      unitType: "ALL",
      priceMin: "",
      priceMax: "",
      quantityMin: "",
      quantityMax: "",
      validity: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro ao buscar produtos");
    },
  });

  // SearchSelect: Fornecedores
  const { options: supplierOptions, handleSearch: handleSearchSuppliers } =
    useSearchOptions<ISupplier>({
      searchFn: async (params) => {
        return await searchSuppliersForOptions(params);
      },
      mapFn: (supplier) => ({
        value: supplier.id ?? "",
        label: supplier.name,
      }),
      selectFn: async (id) => {
        return await getSupplierById(id);
      },
      errorLabel: "fornecedores",
      autoLoad: false,
      perPage: 50,
    });

  // SearchSelect: Categorias
  const { options: categoryOptions, handleSearch: handleSearchCategories } =
    useSearchOptions<ICategory>({
      searchFn: async (params) => {
        return await searchCategoriesForOptions(params);
      },
      mapFn: (category) => ({
        value: category.id ?? "",
        label: category.description,
      }),
      selectFn: async (id) => {
        return await getCategoryById(id);
      },
      errorLabel: "categorias",
      autoLoad: false,
      perPage: 50,
    });

  const handleCreate = () => navigate("/products/create");

  const handleEdit = useCallback(
    (product: IProduct) => {
      if (product.id) {
        navigate(`/products/${product.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (product: IProduct) => {
      if (product.id) {
        navigate(`/products/${product.id}/view`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (product: IProduct) => {
      if (!product.id) return;

      try {
        await deleteProduct(product.id);
        handleSuccess("Produto excluído com sucesso");
        handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir produto");
      }
    },
    [deleteProduct, handleSearch]
  );

  const handleExport = useCallback(() => {
    // Função vazia (mock)
  }, []);

  const handleDeleteMultiple = useCallback(() => {
    // Função vazia (mock)
  }, []);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        handleError(new Error("Arquivo deve ser CSV"), "Formato inválido");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          const base64 = btoa(result);
          console.log("Arquivo em base64:", base64);
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const columns = useMemo<ColumnDef<IProduct>[]>(
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
        id: "image",
        header: "Imagem",
        cell: ({ row }) => {
          const img = row.original.image;
          const src = typeof img === "string" && img.trim() ? img : null;
          return (
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  —
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "productCode",
        header: "Código",
      },
      {
        accessorKey: "name",
        header: "Nome",
      },
      {
        id: "supplier",
        header: "Fornecedor",
        cell: ({ row }) => row.original.supplier?.name ?? "-",
      },
      {
        id: "categories",
        header: "Categorias",
        cell: ({ row }) =>
          row.original.categories?.map((c) => c.description).join(", ") || "-",
      },
      {
        accessorKey: "price",
        header: "Preço",
        cell: ({ row }) => formatCurrency(Number(row.original.price)),
      },
      {
        accessorKey: "quantity",
        header: "Estoque",
        cell: ({ row }) =>
          `${formatNumber(Number(row.original.quantity))} ${
            UNIT_TYPE_LABELS[row.original.unitType as TUnitTypeAlias] ??
            String(row.original.unitType)
          }`,
      },
      {
        accessorKey: "validity",
        header: "Validade",
        cell: ({ row }) =>
          row.original.validity ? formatDateOnly(row.original.validity) : "-",
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
    <>
      <EntityIndexPage
        title="Produtos"
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
                placeholder="Pesquisar produto..."
                aria-label="Pesquisar"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre a listagem de produtos."
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
                      value: filters.supplierId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          supplierId: value ? String(value) : "",
                        })),
                    }}
                    data={supplierOptions}
                    onSearch={handleSearchSuppliers}
                    placeholder="Selecione um fornecedor..."
                    label="Fornecedor"
                  />
                </div>

                <div className="grid gap-2">
                  <SearchSelect<IOption>
                    field={{
                      value: filters.categoryId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          categoryId: value ? String(value) : "",
                        })),
                    }}
                    data={categoryOptions}
                    onSearch={handleSearchCategories}
                    placeholder="Selecione uma categoria..."
                    label="Categoria"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Unidade de Medida</Label>
                  <Select
                    value={filters.unitType}
                    onValueChange={(val) =>
                      setFilters((prev) => ({ ...prev, unitType: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      {(
                        Object.keys(TUnitType) as Array<keyof typeof TUnitType>
                      ).map((key) => {
                        const type = TUnitType[key];
                        return (
                          <SelectItem key={type} value={String(type)}>
                            {UNIT_TYPE_LABELS[type as TUnitTypeAlias]}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="productCodeFilter">Código</Label>
                  <Input
                    id="productCodeFilter"
                    value={filters.productCode}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        productCode: e.target.value,
                      }))
                    }
                    placeholder="Filtrar por código..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nameFilter">Nome</Label>
                  <Input
                    id="nameFilter"
                    value={filters.name}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Filtrar por nome..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="priceMinFilter">Preço Mín.</Label>
                    <Input
                      id="priceMinFilter"
                      type="number"
                      step="0.01"
                      value={filters.priceMin}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceMin: e.target.value,
                        }))
                      }
                      placeholder="0,00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priceMaxFilter">Preço Máx.</Label>
                    <Input
                      id="priceMaxFilter"
                      type="number"
                      step="0.01"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceMax: e.target.value,
                        }))
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="quantityMinFilter">Estoque Mín.</Label>
                    <Input
                      id="quantityMinFilter"
                      type="number"
                      value={filters.quantityMin}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          quantityMin: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantityMaxFilter">Estoque Máx.</Label>
                    <Input
                      id="quantityMaxFilter"
                      type="number"
                      value={filters.quantityMax}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          quantityMax: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="validityFilter">Validade</Label>
                  <Input
                    id="validityFilter"
                    type="date"
                    value={filters.validity}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        validity: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={products}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={handleCreate}
        onExport={handleExport}
        onDeleteMultiple={handleDeleteMultiple}
        onImport={handleImport}
      />
    </>
  );
}

export default function ProductsPageWrapper() {
  return (
    <SuppliersProvider>
      <CategoriesProvider>
        <ProductsProvider>
          <Products />
        </ProductsProvider>
      </CategoriesProvider>
    </SuppliersProvider>
  );
}
