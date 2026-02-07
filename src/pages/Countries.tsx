import { useMemo, useCallback, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useCountries } from "@/hooks/use-countries";
import { useIndexSearch } from "@/hooks/use-index-search";
import type { ICountry } from "@/interfaces/locations.interface";
import { CountriesProvider } from "@/providers/countries.provider";

type CountryFilters = {
  search: string;
  acronymIso: string;
  bacenCode: string;
};

function Countries() {
  const navigate = useNavigate();
  const { countries, pagination, searchCountries, deleteCountry } =
    useCountries();
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
  } = useIndexSearch<CountryFilters, "search">({
    search: searchCountries,
    initialFilters: {
      search: "",
      acronymIso: "",
      bacenCode: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar países");
    },
  });

  const handleCreate = () => navigate("/countries/create");

  const handleEdit = useCallback(
    (country: ICountry) => {
      if (country.id) {
        navigate(`/countries/${country.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (country: ICountry) => {
      if (country.id) {
        navigate(`/countries/${country.id}/view`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (country: ICountry) => {
      if (!country.id) return;

      try {
        await deleteCountry(country.id);
        handleSuccess("País excluído com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir país");
      }
    },
    [deleteCountry, handleSearch]
  );

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExport = useCallback((_ids?: string[]) => {
    // Função vazia conforme solicitado
  }, []);

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteMultiple = useCallback((_ids: string[]) => {
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

  const columns = useMemo<ColumnDef<ICountry>[]>(
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
          const country = row.original;
          return country.name;
        },
      },
      {
        accessorKey: "acronymIso",
        header: "Acrônimo ISO",
        cell: ({ row }) => {
          const country = row.original;
          return country.acronymIso;
        },
      },
      {
        accessorKey: "bacenCode",
        header: "Código BACEN",
        cell: ({ row }) => {
          const country = row.original;
          return country.bacenCode || "-";
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
      title="Países"
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
              placeholder="Pesquisar país..."
              aria-label="Pesquisar país"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de países."
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
              <Label htmlFor="countryFilterSearch">Nome</Label>
              <Input
                id="countryFilterSearch"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="Ex.: Brasil"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="countryFilterAcronymIso">Acrônimo ISO</Label>
              <Input
                id="countryFilterAcronymIso"
                value={filters.acronymIso}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    acronymIso: e.target.value,
                  }))
                }
                placeholder="Ex.: BR"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="countryFilterBacenCode">Código BACEN</Label>
              <Input
                id="countryFilterBacenCode"
                value={filters.bacenCode}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    bacenCode: e.target.value,
                  }))
                }
                placeholder="Ex.: 1058"
              />
            </div>
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={countries}
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

export default function CountriesPageWrapper() {
  return (
    <CountriesProvider>
      <Countries />
    </CountriesProvider>
  );
}
