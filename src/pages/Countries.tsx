import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Download, Trash2, Upload, Search, Filter } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useCountries } from "@/hooks/use-countries";
import type { ICountry } from "@/interfaces/locations.interface";
import { CountriesProvider } from "@/providers/countries.provider";

type CountryFilters = {
  name: string;
  acronymIso: string;
  bacenCode: string;
};

function Countries() {
  const navigate = useNavigate();
  const { countries, pagination, searchCountries, deleteCountry } =
    useCountries();
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<CountryFilters>({
    name: "",
    acronymIso: "",
    bacenCode: "",
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSearched = useRef(false);
  const didTypeSearchOnceRef = useRef(false);

  const searchCountriesRef = useRef(searchCountries);
  const perPageRef = useRef(perPage);
  const filtersRef = useRef(filters);
  const isFiltersOpenRef = useRef(isFiltersOpen);

  useEffect(() => {
    searchCountriesRef.current = searchCountries;
  }, [searchCountries]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const handleFiltersOpenChange = (open: boolean) => {
    isFiltersOpenRef.current = open;
    setIsFiltersOpen(open);
  };

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const buildQueryFilters = useCallback((): Record<string, string> => {
    const { name, acronymIso, bacenCode } = filtersRef.current;

    const queryFilters: Record<string, string> = {};

    if (name.trim()) queryFilters.name = name.trim();
    if (acronymIso.trim()) queryFilters.acronymIso = acronymIso.trim();
    if (bacenCode.trim()) queryFilters.bacenCode = bacenCode.trim();

    return queryFilters;
  }, []);

  const handleSearch = useCallback(
    (page = 1) => {
      searchCountriesRef
        .current({
          filters: buildQueryFilters(),
          page,
          perPage: perPageRef.current,
        })
        .catch((error) => {
          handleError(error, "Erro desconhecido ao buscar países");
        });
    },
    [buildQueryFilters]
  );

  const handlePageChange = (page: number) => handleSearch(page);

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
        handleSearch(1);
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
          // Arquivo convertido para base64, pronto para enviar
          console.log("Arquivo em base64:", base64);
        }
      };
      reader.readAsText(file);
    },
    []
  );

  useEffect(() => {
    if (hasSearched.current) {
      searchCountriesRef
        .current({
          filters: buildQueryFilters(),
          page: 1,
          perPage,
        })
        .catch((error) =>
          handleError(error, "Erro desconhecido ao buscar países")
        );
    } else {
      hasSearched.current = true;
      handleSearch(1);
    }
  }, [perPage, buildQueryFilters, handleSearch]);

  // Pesquisa rápida (campo de busca) → mapeia para filters.name
  useEffect(() => {
    if (!didTypeSearchOnceRef.current) {
      didTypeSearchOnceRef.current = true;
      return;
    }

    // Evita buscar enquanto o painel de filtros estiver aberto.
    // Importante: não depende de isFiltersOpen, para não disparar busca ao fechar.
    if (isFiltersOpenRef.current) return;

    const timer = setTimeout(() => {
      handleSearch(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.name, handleSearch]);

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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Países</CardTitle>
              {selectedIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selecionado
                  {selectedIds.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <InputGroup className="w-full md:w-[280px]">
                <InputGroupAddon>
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  value={filters.name}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Pesquisar país..."
                  aria-label="Pesquisar país"
                />
              </InputGroup>
              <Sheet
                open={isFiltersOpen}
                onOpenChange={handleFiltersOpenChange}
              >
                <SheetTrigger asChild>
                  <Button variant="outline" type="button" aria-label="Filtros">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[320px] max-w-[90vw] sm:w-[380px] sm:max-w-none"
                >
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Filtre a listagem de países.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="grid gap-4 px-4 pb-4">
                    <div className="grid gap-2">
                      <Label htmlFor="countryFilterName">Nome</Label>
                      <Input
                        id="countryFilterName"
                        value={filters.name}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Ex.: Brasil"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="countryFilterAcronymIso">
                        Acrônimo ISO
                      </Label>
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
                      <Label htmlFor="countryFilterBacenCode">
                        Código BACEN
                      </Label>
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
                  </div>

                  <SheetFooter>
                    <Button
                      type="button"
                      onClick={() => {
                        handleSearch(1);
                        handleFiltersOpenChange(false);
                      }}
                    >
                      Aplicar filtros
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFilters({ name: "", acronymIso: "", bacenCode: "" });
                        handleSearch(1);
                        handleFiltersOpenChange(false);
                      }}
                    >
                      Limpar
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  handleExport(selectedIds.length > 0 ? selectedIds : undefined)
                }
              >
                <Download className="h-4 w-4" />
              </Button>
              {selectedIds.length > 0 && (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:text-destructive"
                  onClick={() => handleDeleteMultiple(selectedIds)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={countries}
            page={pagination?.currentPage ?? 1}
            totalPages={pagination?.lastPage ?? 1}
            total={pagination?.total ?? 0}
            onPageChange={handlePageChange}
            onPerPageChange={setPerPage}
            onSelectionChange={setSelectedIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CountriesPageWrapper() {
  return (
    <CountriesProvider>
      <Countries />
    </CountriesProvider>
  );
}
