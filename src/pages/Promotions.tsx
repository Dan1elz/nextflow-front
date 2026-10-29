import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";
import {
  PromotionSourceBadge,
  PromotionStatusBadge,
} from "@/components/app/forecast-badges";
import { CreatePromotionDialog } from "@/components/app/create-promotion-dialog";

import { usePromotions } from "@/hooks/use-promotions";
import { useProducts } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSearchOptions } from "@/hooks/use-search-options";
import { PromotionsProvider } from "@/providers/promotions.provider";
import { ProductsProvider } from "@/providers/products.provider";

import type { IIndexParams, IOption } from "@/interfaces/api.interface";
import type { IProduct } from "@/interfaces/product.interface";
import type { IPromotion } from "@/interfaces/promotion.interface";
import { TLegacyPromotionSource, TLegacyPromotionStatus } from "@/types/enums";
import { isAdmin } from "@/utils/auth.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
} from "@/utils/format.helpers";
import { formatDiscount } from "@/utils/forecast.helpers";

type PromotionFilters = {
  productId: string;
  status: string;
  source: string;
};

const ALL = "all";

function Promotions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const { promotions, pagination, searchPromotions, cancelPromotion } =
    usePromotions();
  const { searchProductsForOptions, getProductById } = useProducts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Remove os valores "all" antes de enviar os filtros (productId, status, source) à API.
  const customSearch = useCallback(
    async (params?: IIndexParams) => {
      const activeFilters = { ...params?.filters } as Record<string, string>;
      if (activeFilters.status === ALL) delete activeFilters.status;
      if (activeFilters.source === ALL) delete activeFilters.source;
      await searchPromotions({ ...params, filters: activeFilters });
    },
    [searchPromotions]
  );

  const {
    setPerPage,
    selectedIds,
    setSelectedIds,
    filters,
    setFilters,
    handleSearch,
    handlePageChange,
  } = useIndexSearch<PromotionFilters, "productId">({
    search: customSearch,
    initialFilters: { productId: "", status: ALL, source: ALL },
    quickSearchKey: "productId",
    perPageInitial: 10,
    debounceMs: 300,
    onError: (error) => handleError(error, "Erro ao buscar promoções"),
  });

  const { options: productOptions, handleSearch: handleSearchProducts } =
    useSearchOptions<IProduct>({
      searchFn: searchProductsForOptions,
      mapFn: (p) => ({
        value: p.id ?? "",
        label: `${p.productCode} - ${p.name}`,
      }),
      selectFn: getProductById,
      errorLabel: "produtos",
      autoLoad: false,
      perPage: 50,
    });

  const currentPage = pagination?.currentPage ?? 1;

  const handleCancel = useCallback(
    async (promotion: IPromotion) => {
      try {
        await cancelPromotion(promotion.id);
        handleSuccess("Promoção cancelada com sucesso");
        await handleSearch(currentPage);
      } catch (error) {
        handleError(error, "Erro ao cancelar promoção");
      }
    },
    [cancelPromotion, handleSearch, currentPage]
  );

  const handleViewProduct = useCallback(
    (promotion: IPromotion) =>
      navigate(`/products/${promotion.productId}/view`),
    [navigate]
  );

  const columns = useMemo<ColumnDef<IPromotion>[]>(
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
        cell: ({ row }) => {
          const product = row.original.product;
          return product ? (
            <div className="flex flex-col">
              <span className="font-medium">{product.name}</span>
              <span className="text-xs text-muted-foreground">
                Cód. {product.productCode}
              </span>
            </div>
          ) : (
            "-"
          );
        },
      },
      {
        accessorKey: "discountPercent",
        header: "Desconto",
        cell: ({ row }) => (
          <span className="font-semibold text-violet-700 dark:text-violet-400">
            {formatDiscount(row.original.discountPercent)}
          </span>
        ),
      },
      {
        id: "price",
        header: "Preço",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            <span className="mr-1.5 text-xs text-muted-foreground line-through">
              {formatCurrency(Number(row.original.originalPrice))}
            </span>
            <span className="font-semibold">
              {formatCurrency(Number(row.original.promotionalPrice))}
            </span>
          </span>
        ),
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
          <PromotionStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "source",
        header: "Origem",
        cell: ({ row }) => (
          <PromotionSourceBadge source={row.original.source} />
        ),
      },
      {
        accessorKey: "reason",
        header: "Motivo",
        cell: ({ row }) =>
          row.original.reason ? (
            <span
              className="line-clamp-2 max-w-[260px] text-xs text-muted-foreground"
              title={row.original.reason}
            >
              {row.original.reason}
            </span>
          ) : (
            "-"
          ),
      },
      {
        accessorKey: "createAt",
        header: "Criada",
        cell: ({ row }) =>
          row.original.createAt ? formatDateTime(row.original.createAt) : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const canCancel =
            admin &&
            row.original.isActive &&
            (row.original.status === TLegacyPromotionStatus.Active ||
              row.original.status === TLegacyPromotionStatus.Scheduled);
          return (
            <NavActionColumn
              object={row.original}
              onDelete={canCancel ? handleCancel : undefined}
              deleteLabel="Cancelar"
              deleteDialogTitle="Cancelar promoção"
              deleteDialogDescription="O preço do produto volta ao valor normal imediatamente (se a promoção estiver vigente). Esta ação não pode ser desfeita."
              deleteButtonLabel="Confirmar cancelamento"
              extraActions={[
                {
                  label: "Ver produto",
                  icon: <Package className="mr-2 h-4 w-4" />,
                  onClick: handleViewProduct,
                },
              ]}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [admin, handleCancel, handleViewProduct]
  );

  const applyFilterAndSearch = (patch: Partial<PromotionFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setTimeout(() => handleSearch(1), 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="px-4 md:px-0">
        <Tabs
          value={filters.status}
          onValueChange={(val) => applyFilterAndSearch({ status: val })}
          className="w-full flex-wrap"
        >
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto p-1 md:w-auto">
            <TabsTrigger value={ALL}>Todas</TabsTrigger>
            <TabsTrigger value={TLegacyPromotionStatus.Active}>Vigentes</TabsTrigger>
            <TabsTrigger value={TLegacyPromotionStatus.Scheduled}>
              Agendadas
            </TabsTrigger>
            <TabsTrigger value={TLegacyPromotionStatus.Ended}>Encerradas</TabsTrigger>
            <TabsTrigger value={TLegacyPromotionStatus.Canceled}>
              Canceladas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <EntityIndexPage
        title="Promoções"
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <SearchSelect<IOption>
              className="w-full md:w-[280px] space-y-0"
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
              placeholder="Filtrar por produto..."
            />
            <Select
              value={filters.source}
              onValueChange={(val) => applyFilterAndSearch({ source: val })}
            >
              <SelectTrigger
                className="w-full md:w-[190px]"
                aria-label="Origem"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as origens</SelectItem>
                <SelectItem value={String(TLegacyPromotionSource.Manual)}>
                  Manual
                </SelectItem>
                <SelectItem value={String(TLegacyPromotionSource.AiRecommendation)}>
                  Recomendação da IA
                </SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        columns={columns}
        data={promotions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={admin ? () => setIsCreateOpen(true) : undefined}
      />

      {admin && (
        <CreatePromotionDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => void handleSearch(1)}
        />
      )}
    </div>
  );
}

export default function PromotionsPageWrapper() {
  return (
    <ProductsProvider>
      <PromotionsProvider>
        <Promotions />
      </PromotionsProvider>
    </ProductsProvider>
  );
}
