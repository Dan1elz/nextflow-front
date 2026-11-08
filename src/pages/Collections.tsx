import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { CollectionViewDialog } from "@/components/app/collection-view-dialog";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";
import { CollectionForm } from "@/components/forms/collection-form";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useCollections } from "@/hooks/use-collections";
import { useIndexSearch } from "@/hooks/use-index-search";
import type { IOption } from "@/interfaces/api.interface";
import type { CollectionResponseDto } from "@/interfaces/collection.interface";
import { CollectionsProvider } from "@/providers/collections.provider";
import type { CollectionFormData } from "@/schemas/collection.schema";
import { formatDateOnly } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type CollectionFilters = {
  search: string;
  isActive: string;
};

type CollectionDialog = { collection: CollectionResponseDto | null } | null;

const statusOptions: IOption[] = [
  { value: "true", label: "Ativa" },
  { value: "false", label: "Inativa" },
];

function Collections() {
  const {
    collections,
    pagination,
    searchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    reactivateCollection,
  } = useCollections();
  const [dialog, setDialog] = useState<CollectionDialog>(null);
  const [viewing, setViewing] = useState<CollectionResponseDto | null>(null);
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
  } = useIndexSearch<CollectionFilters, "search">({
    search: searchCollections,
    initialFilters: { search: "", isActive: "" },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar coleções"),
  });

  const handleDelete = useCallback(
    async (collection: CollectionResponseDto) => {
      try {
        await deleteCollection(collection.id);
        handleSuccess("Coleção inativada com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao inativar coleção");
      }
    },
    [deleteCollection, handleSearch]
  );

  const handleReactivate = useCallback(
    async (collection: CollectionResponseDto) => {
      try {
        await reactivateCollection(collection.id);
        handleSuccess("Coleção reativada com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao reativar coleção");
      }
    },
    [reactivateCollection, handleSearch]
  );

  const handleSave = async (data: CollectionFormData) => {
    const dto = {
      name: data.name,
      startsOn: data.startsOn || null,
      endsOn: data.endsOn || null,
    };
    if (dialog?.collection) {
      await updateCollection(dialog.collection.id, dto);
      handleSuccess("Coleção atualizada com sucesso");
    } else {
      await createCollection(dto);
      handleSuccess("Coleção criada com sucesso");
    }
    setDialog(null);
    await handleSearch(1);
  };

  const columns = useMemo<ColumnDef<CollectionResponseDto>[]>(
    () => [
      { accessorKey: "name", header: "Nome" },
      {
        accessorKey: "startsOn",
        header: "Início",
        cell: ({ row }) =>
          row.original.startsOn ? formatDateOnly(row.original.startsOn) : "-",
      },
      {
        accessorKey: "endsOn",
        header: "Fim",
        cell: ({ row }) =>
          row.original.endsOn ? formatDateOnly(row.original.endsOn) : "-",
      },
      { accessorKey: "productCount", header: "Produtos" },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Ativa" : "Inativa"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onEdit={(collection) => setDialog({ collection })}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            onView={setViewing}
            disableDelete={!row.original.isActive}
            disableEdit={!row.original.isActive}
            disableReactivate={row.original.isActive}
            deleteLabel="Inativar"
            deleteDialogTitle="Inativar esta coleção?"
            deleteDialogDescription="A coleção sai dos combos de produto. Você pode reativá-la depois."
            deleteButtonLabel="Inativar"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleReactivate]
  );

  return (
    <>
      <EntityIndexPage
        title="Coleções"
        onRowOpen={setViewing}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <InputGroup className="w-full md:w-[280px]">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Pesquisar por nome..."
                aria-label="Pesquisar coleção"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre a listagem de coleções."
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
                field={{
                  value: filters.isActive,
                  onChange: (value) =>
                    setFilters((prev) => ({
                      ...prev,
                      isActive: value ? String(value) : "",
                    })),
                }}
                label="Status"
                data={statusOptions}
                placeholder="Todos"
              />
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={collections}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={() => setDialog({ collection: null })}
      />

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.collection ? "Editar coleção" : "Nova coleção"}
            </DialogTitle>
            <DialogDescription>
              Coleção ou temporada, com início e fim opcionais.
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <CollectionForm
              initialData={dialog.collection}
              onSubmit={handleSave}
              onCancel={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <CollectionViewDialog
        collection={viewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}

export default function CollectionsPageWrapper() {
  return (
    <CollectionsProvider>
      <Collections />
    </CollectionsProvider>
  );
}
