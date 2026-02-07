import { useMemo, useCallback, type ChangeEvent } from "react";
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
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { SearchSelect } from "@/components/app/search-select";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useSearchOptions } from "@/hooks/use-search-options";
import type { IOption } from "@/interfaces/api.interface";
import { useCountries } from "@/hooks/use-countries";
import { useStates } from "@/hooks/use-states";
import { useIndexSearch } from "@/hooks/use-index-search";
import type { ICountry, IState } from "@/interfaces/locations.interface";
import { CountriesProvider } from "@/providers/countries.provider";
import { StatesProvider } from "@/providers/states.provider";

type StateFilters = {
  search: string;
  acronym: string;
  ibgeCode: string;
  countryId: string;
};

function States() {
  const navigate = useNavigate();
  const { states, pagination, searchStates, deleteState } = useStates();
  const { searchCountriesForOptions, getCountryById } = useCountries();
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
  } = useIndexSearch<StateFilters, "search">({
    search: searchStates,
    initialFilters: {
      search: "",
      acronym: "",
      ibgeCode: "",
      countryId: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar estados");
    },
  });

  const { options: countriesOptions, handleSearch: handleSearchCountries } =
    useSearchOptions<ICountry>({
      searchFn: searchCountriesForOptions,
      mapFn: (country) => ({
        value: country.id ?? "",
        label: country.name,
      }),
      selectFn: getCountryById,
      errorLabel: "países",
      autoLoad: false,
      perPage: 50,
    });

  const handleCreate = () => navigate("/states/create");

  const handleEdit = useCallback(
    (state: IState) => {
      if (state.id) {
        navigate(`/states/${state.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (state: IState) => {
      if (state.id) {
        navigate(`/states/${state.id}/view`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (state: IState) => {
      if (!state.id) return;

      try {
        await deleteState(state.id);
        handleSuccess("Estado excluído com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir estado");
      }
    },
    [deleteState, handleSearch]
  );
  const handleExport = useCallback((_ids?: string[]) => {
    void _ids;
    // Função vazia conforme solicitado
  }, []);

  const handleDeleteMultiple = useCallback((_ids: string[]) => {
    void _ids;
    // Função vazia conforme solicitado
  }, []);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
        // Arquivo convertido para base64, pronto para enviar
        console.log("Arquivo em base64:", base64);
      }
    };
    reader.readAsText(file);
  }, []);

  const columns = useMemo<ColumnDef<IState>[]>(
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
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => {
          const state = row.original;
          return state.name;
        },
      },
      {
        accessorKey: "acronym",
        header: "Acrônimo",
        cell: ({ row }) => {
          const state = row.original;
          return state.acronym;
        },
      },
      {
        accessorKey: "ibgeCode",
        header: "IBGE Code",
        cell: ({ row }) => {
          const state = row.original;
          return state.ibgeCode;
        },
      },
      {
        accessorKey: "country",
        header: "País",
        cell: ({ row }) => {
          const state = row.original;
          return state.country?.name ?? "-";
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          return (
            <NavActionColumn
              object={row.original}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleView]
  );

  return (
    <EntityIndexPage
      title="Estados"
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
              placeholder="Pesquisar estado..."
              aria-label="Pesquisar estado"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de estados."
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
            <div className="grid gap-2">
              <Label htmlFor="stateFilterSearch">Nome</Label>
              <Input
                id="stateFilterSearch"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="Ex.: São Paulo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stateFilterAcronym">Acrônimo</Label>
              <Input
                id="stateFilterAcronym"
                value={filters.acronym}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    acronym: e.target.value,
                  }))
                }
                placeholder="Ex.: SP"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stateFilterIbgeCode">IBGE Code</Label>
              <Input
                id="stateFilterIbgeCode"
                value={filters.ibgeCode}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    ibgeCode: e.target.value,
                  }))
                }
                placeholder="Ex.: 35"
              />
            </div>

            <div className="grid gap-2">
              <SearchSelect<IOption>
                field={{
                  value: filters.countryId,
                  onChange: (value) =>
                    setFilters((prev) => ({
                      ...prev,
                      countryId: value ? String(value) : "",
                    })),
                }}
                label="País"
                data={countriesOptions}
                onSearch={handleSearchCountries}
                placeholder="País"
              />
            </div>
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={states}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={handleCreate}
      onImport={handleImport}
      onExport={handleExport}
      onDeleteMultiple={handleDeleteMultiple}
    />
  );
}

export default function StatesPageWrapper() {
  return (
    <CountriesProvider>
      <StatesProvider>
        <States />
      </StatesProvider>
    </CountriesProvider>
  );
}
