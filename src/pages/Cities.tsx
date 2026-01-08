import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Download, Trash2, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useCities } from "@/hooks/use-cities";
import type { ICity } from "@/interfaces/locations.interface";
import { CitiesProvider } from "@/providers/cities.provider";

function Cities() {
  const navigate = useNavigate();
  const { cities, pagination, searchCities, deleteCity } = useCities();
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSearched = useRef(false);

  const searchCitiesRef = useRef(searchCities);
  const perPageRef = useRef(perPage);

  useEffect(() => {
    searchCitiesRef.current = searchCities;
  }, [searchCities]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const handleSearch = useCallback((page = 1) => {
    searchCitiesRef
      .current({
        filters: {},
        page,
        perPage: perPageRef.current,
      })
      .catch((error) => {
        handleError(error, "Erro desconhecido ao buscar cidades");
      });
  }, []);

  const handlePageChange = (page: number) => handleSearch(page);

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
        handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir cidade");
      }
    },
    [deleteCity, handleSearch]
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
      searchCitiesRef
        .current({
          filters: {},
          page: 1,
          perPage,
        })
        .catch((error) =>
          handleError(error, "Erro desconhecido ao buscar cidades")
        );
    } else {
      hasSearched.current = true;
      handleSearch(1);
    }
  }, [perPage, handleSearch]);

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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Cidades</CardTitle>
              {selectedIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selecionado
                  {selectedIds.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
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
            data={cities}
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

export default function CitiesPageWrapper() {
  return (
    <CitiesProvider>
      <Cities />
    </CitiesProvider>
  );
}
