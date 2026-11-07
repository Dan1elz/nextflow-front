import { useCallback, useMemo, useState } from "react";

import { DatePicker } from "@/components/app/date-picker";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { buildPromotionColumns } from "@/components/app/promotion-columns";
import { PromotionCreateDialog } from "@/components/app/promotion-create-dialog";
import { SearchSelect } from "@/components/app/search-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { useIndexSearch } from "@/hooks/use-index-search";
import { usePromotions } from "@/hooks/use-promotions";
import type { IOption } from "@/interfaces/api.interface";
import type { PromotionListItemDto } from "@/interfaces/promotion.interface";
import { PromotionsProvider } from "@/providers/promotions.provider";
import {
  PROMOTION_SOURCE_LABELS,
  PROMOTION_STATUS_LABELS,
  TPromotionSource,
  TPromotionStatus,
} from "@/types/enums";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type PromotionIndexFilters = {
  status: string;
  source: string;
  productId: string;
  from: string;
  to: string;
};

const statusOptions: IOption[] = Object.values(TPromotionStatus).map(
  (value) => ({ value, label: PROMOTION_STATUS_LABELS[value] })
);

const sourceOptions: IOption[] = Object.values(TPromotionSource).map(
  (value) => ({ value, label: PROMOTION_SOURCE_LABELS[value] })
);

function Promotions() {
  const {
    promotions,
    pagination,
    searchPromotions,
    cancelPromotion,
    searchProductOptions,
  } = usePromotions();
  const [isCreating, setIsCreating] = useState(false);
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
  } = useIndexSearch<PromotionIndexFilters, "status">({
    search: searchPromotions,
    initialFilters: { status: "", source: "", productId: "", from: "", to: "" },
    quickSearchKey: "status",
    perPageInitial: 10,
    debounceMs: 0,
    onError: (error) => handleError(error, "Erro ao buscar promoções"),
  });

  const handleCancel = useCallback(
    async (promotion: PromotionListItemDto) => {
      try {
        await cancelPromotion(promotion.id);
        handleSuccess("Promoção cancelada");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao cancelar a promoção");
      }
    },
    [cancelPromotion, handleSearch]
  );

  const columns = useMemo(
    () => buildPromotionColumns(handleCancel),
    [handleCancel]
  );

  const setFilter =
    (key: keyof PromotionIndexFilters) =>
    (value: string | number | undefined) =>
      setFilters((prev) => ({ ...prev, [key]: value ? String(value) : "" }));

  return (
    <>
      <EntityIndexPage
        title="Promoções"
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <SearchSelect<IOption>
              field={{ value: filters.status, onChange: setFilter("status") }}
              data={statusOptions}
              placeholder="Todos os status"
              className="w-full md:w-[200px]"
            />
            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre as promoções por origem, produto e período."
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
              <SearchSelect<IOption>
                field={{ value: filters.source, onChange: setFilter("source") }}
                label="Origem"
                data={sourceOptions}
                placeholder="Todas"
              />
              <SearchSelect<IOption>
                field={{
                  value: filters.productId,
                  onChange: setFilter("productId"),
                }}
                label="Produto"
                data={[]}
                onSearch={searchProductOptions}
                placeholder="Todos"
              />
              <Field>
                <FieldLabel>De</FieldLabel>
                <DatePicker
                  value={filters.from}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, from: value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Até</FieldLabel>
                <DatePicker
                  value={filters.to}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, to: value }))
                  }
                />
              </Field>
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={promotions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={() => setIsCreating(true)}
      />

      <PromotionCreateDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        onCreated={() => handleSearch(1)}
      />
    </>
  );
}

export default function PromotionsPageWrapper() {
  return (
    <PromotionsProvider>
      <Promotions />
    </PromotionsProvider>
  );
}
