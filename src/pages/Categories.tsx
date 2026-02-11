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
import { NavActionColumn } from "@/components/app/nav-action-column";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { useCategories } from "@/hooks/use-categories";
import { useIndexSearch } from "@/hooks/use-index-search";
import type { ICategory } from "@/interfaces/category.interface";
import { CategoriesProvider } from "@/providers/categories.provider";

type CategoryFilters = {
  search: string;
};

function Categories() {
  const navigate = useNavigate();
  const { categories, pagination, searchCategories, deleteCategory } =
    useCategories();
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
  } = useIndexSearch<CategoryFilters, "search">({
    search: searchCategories,
    initialFilters: {
      search: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar categorias");
    },
  });

  const handleCreate = () => navigate("/categories/create");

  const handleEdit = useCallback(
    (category: ICategory) => {
      if (category.id) {
        navigate(`/categories/${category.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (category: ICategory) => {
      if (category.id) {
        navigate(`/categories/${category.id}/view`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (category: ICategory) => {
      if (!category.id) return;

      try {
        await deleteCategory(category.id);
        handleSuccess("Categoria excluída com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir categoria");
      }
    },
    [deleteCategory, handleSearch]
  );
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExport = useCallback((_ids?: string[]) => {
    void _ids;
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
        console.log("Arquivo em base64:", base64);
      }
    };
    reader.readAsText(file);
  }, []);

  const columns = useMemo<ColumnDef<ICategory>[]>(
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
        accessorKey: "description",
        header: "Descrição",
        cell: ({ row }) => row.original.description,
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
              <CardTitle>Categorias</CardTitle>
              {selectedIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selecionada
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
                <Plus className="h-4 w-4 " /> 
              </Button>
            </div>
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={categories}
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

export default function CategoriesPageWrapper() {
  return (
    <CategoriesProvider>
      <Categories />
    </CategoriesProvider>
  );
}
