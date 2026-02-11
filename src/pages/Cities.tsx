import { useMemo, useCallback, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavActionColumn } from "@/components/app/nav-action-column";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { SearchSelect } from "@/components/app/search-select";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useCities } from "@/hooks/use-cities";
import { useStates } from "@/hooks/use-states";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSearchOptions } from "@/hooks/use-search-options";
import type { IOption } from "@/interfaces/api.interface";
import type { ICity } from "@/interfaces/locations.interface";
import type { IState } from "@/interfaces/locations.interface";
import { CitiesProvider } from "@/providers/cities.provider";
import { StatesProvider } from "@/providers/states.provider";

type CityFilters = {
  search: string;
  ibgeCode: string;
  stateId: string;
};

function Cities() {
  const navigate = useNavigate();
  const { cities, pagination, searchCities, deleteCity } = useCities();
  const { searchStatesForOptions, getStateById } = useStates();
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
  } = useIndexSearch<CityFilters, "search">({
    search: searchCities,
    initialFilters: {
      search: "",
      ibgeCode: "",
      stateId: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar cidades");
    },
  });

  const { options: statesOptions, handleSearch: handleSearchStates } =
    useSearchOptions<IState>({
      searchFn: searchStatesForOptions,
      mapFn: (state) => ({
        value: state.id ?? "",
        label: state.name,
      }),
      selectFn: getStateById,
      errorLabel: "estados",
      autoLoad: false,
      perPage: 50,
    });

  const handleCreate = () => navigate("/cities/create");

  const handleEdit = useCallback(
    (city: ICity) => {
      if (city.id) {
        navigate(`/cities/${city.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (city: ICity) => {
      if (city.id) {
        navigate(`/cities/${city.id}/view`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (city: ICity) => {
      if (!city.id) return;

      try {
        await deleteCity(city.id);
        handleSuccess("Cidade excluída com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir cidade");
      }
    },
    [deleteCity, handleSearch]
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

  const columns = useMemo<ColumnDef<ICity>[]>(
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
          const city = row.original;
          return city.name;
        },
      },
      {
        accessorKey: "ibgeCode",
        header: "IBGE Code",
        cell: ({ row }) => {
          const city = row.original;
          return city.ibgeCode;
        },
      },
      {
        accessorKey: "state",
        header: "Estado",
        cell: ({ row }) => {
          const city = row.original;
          return city.state?.name || "-";
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
      title="Cidades"
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
              placeholder="Pesquisar cidade..."
              aria-label="Pesquisar cidade"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de cidades."
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
              <Label htmlFor="cityFilterSearch">Nome</Label>
              <Input
                id="cityFilterSearch"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="Ex.: Campinas"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cityFilterIbgeCode">IBGE Code</Label>
              <Input
                id="cityFilterIbgeCode"
                value={filters.ibgeCode}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    ibgeCode: e.target.value,
                  }))
                }
                placeholder="Ex.: 3509502"
                maxLength={7}
              />
            </div>

            <div className="grid gap-2">
              <SearchSelect<IOption>
                field={{
                  value: filters.stateId,
                  onChange: (value) =>
                    setFilters((prev) => ({
                      ...prev,
                      stateId: value ? String(value) : "",
                    })),
                }}
                label="Estado"
                data={statesOptions}
                onSearch={handleSearchStates}
                placeholder="Estado"
              />
            </div>
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={cities}
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

export default function CitiesPageWrapper() {
  return (
    <CitiesProvider>
      <StatesProvider>
        <Cities />
      </StatesProvider>
    </CitiesProvider>
  );
}
