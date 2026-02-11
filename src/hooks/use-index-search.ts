import { useCallback, useEffect, useRef, useState } from "react";

import type { IIndexParams } from "@/interfaces/api.interface";

type UseIndexSearchArgs<
  TFilters extends Record<string, string>,
  K extends keyof TFilters,
> = {
  search: (query?: IIndexParams) => Promise<void>;
  initialFilters: TFilters;
  quickSearchKey: K;
  perPageInitial?: number;
  debounceMs?: number;
  onError?: (error: unknown) => void;
};

export function useIndexSearch<
  TFilters extends Record<string, string>,
  K extends keyof TFilters,
>({
  search,
  initialFilters,
  quickSearchKey,
  perPageInitial = 10,
  debounceMs = 400,
  onError,
}: UseIndexSearchArgs<TFilters, K>) {
  const [perPage, setPerPage] = useState(perPageInitial);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasSearchedRef = useRef(false);
  const didTypeQuickSearchOnceRef = useRef(false);

  const searchRef = useRef(search);
  const perPageRef = useRef(perPage);
  const filtersRef = useRef(filters);
  const isFiltersOpenRef = useRef(isFiltersOpen);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const handleFiltersOpenChange = useCallback((open: boolean) => {
    isFiltersOpenRef.current = open;
    setIsFiltersOpen(open);
  }, []);

  const buildQueryFilters = useCallback((): Record<string, string> => {
    const currentFilters = filtersRef.current;
    const queryFilters: Record<string, string> = {};

    Object.entries(currentFilters).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (trimmed) queryFilters[key] = trimmed;
    });

    return queryFilters;
  }, []);

  const handleSearch = useCallback(
    async (page = 1) => {
      try {
        await searchRef.current({
          filters: buildQueryFilters(),
          page,
          perPage: perPageRef.current,
        });
      } catch (error) {
        onErrorRef.current?.(error);
      }
    },
    [buildQueryFilters]
  );

  const handlePageChange = (page: number) => handleSearch(page);

  // Busca inicial + refaz busca quando alterar "perPage"
  useEffect(() => {
    if (hasSearchedRef.current) {
      handleSearch(1);
      return;
    }

    hasSearchedRef.current = true;
    handleSearch(1);
  }, [perPage, handleSearch]);

  // Pesquisa rápida (debounce) pelo campo configurado.
  const quickSearchValue = filters[quickSearchKey];
  useEffect(() => {
    if (!didTypeQuickSearchOnceRef.current) {
      didTypeQuickSearchOnceRef.current = true;
      return;
    }

    // Não dispara enquanto o painel de filtros estiver aberto.
    if (isFiltersOpenRef.current) return;

    const timer = setTimeout(() => {
      handleSearch(1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, handleSearch, quickSearchValue]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    perPage,
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
  };
}
