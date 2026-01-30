import { useCallback, useEffect, useRef, useState } from "react";
import { handleError } from "@/utils/toast.helpers";
import type { IOption } from "@/interfaces/api.interface";
import type { IIndexParams } from "@/interfaces/api.interface";

interface UseSearchOptionsConfig<T> {
  searchFn: (
    params?: IIndexParams
  ) => Promise<{ data: T[]; totalItems: number }>;
  mapFn: (item: T) => IOption;
  selectFn?: (id: string) => Promise<T>;
  errorLabel?: string;
  autoLoad?: boolean;
  initialFilters?: Record<string, string>;
  perPage?: number;
  enabled?: boolean;
}

export function useSearchOptions<T extends { id?: string }>({
  searchFn,
  mapFn,
  selectFn,
  errorLabel = "itens",
  autoLoad = false,
  initialFilters,
  perPage = 50,
  enabled = true,
}: UseSearchOptionsConfig<T>) {
  const [options, setOptions] = useState<IOption[]>([]);
  const optionsRef = useRef<IOption[]>([]);
  const loadedRef = useRef(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchingRef = useRef(false);

  // Mantém a ref sincronizada com o estado
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleSearch = useCallback(
    async (query: string, selectedId?: string | number) => {
      if (!enabled) return [];

      // Evita múltiplas buscas simultâneas
      if (isSearchingRef.current) {
        return optionsRef.current;
      }

      // Limpa timeout anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Usa debounce para evitar múltiplas requisições
      return new Promise<IOption[]>((resolve, reject) => {
        searchTimeoutRef.current = setTimeout(async () => {
          if (isSearchingRef.current) {
            resolve(optionsRef.current);
            return;
          }

          try {
            isSearchingRef.current = true;

            const filters: Record<string, string> = {
              ...initialFilters,
              ...(query && { search: query }),
            };

            const response = await searchFn({
              filters,
              page: 1,
              perPage,
            });

            let results = response.data || [];

            // Se há um selectedId e selectFn, garante que o item selecionado está na lista
            if (selectedId && selectFn) {
              try {
                const selectedIdStr = String(selectedId);
                if (
                  selectedIdStr &&
                  selectedIdStr !== "undefined" &&
                  selectedIdStr !== "null"
                ) {
                  const exists = results.some(
                    (item) => String(item.id) === selectedIdStr
                  );
                  if (!exists) {
                    const selectedItem = await selectFn(selectedIdStr);
                    results = [selectedItem, ...results];
                  }
                }
              } catch {
                console.warn("Item não encontrado:", selectedId);
              }
            }

            const mappedOptions = results.map(mapFn);
            setOptions(mappedOptions);
            isSearchingRef.current = false;
            resolve(mappedOptions);
          } catch (error) {
            isSearchingRef.current = false;
            handleError(error, `Erro ao buscar ${errorLabel}`);
            reject(error);
          }
        }, 300); // Debounce de 300ms
      });
    },
    [searchFn, mapFn, selectFn, errorLabel, initialFilters, perPage, enabled]
  );

  useEffect(() => {
    if (autoLoad && enabled && !loadedRef.current) {
      loadedRef.current = true;
      handleSearch("").catch((error) => {
        handleError(error, `Erro ao carregar ${errorLabel}`);
      });
    }
  }, [autoLoad, enabled, handleSearch, errorLabel]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    options,
    handleSearch,
    loadedRef,
    setOptions,
  };
}
