import { useRef, type ChangeEvent, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Trash2, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/app/data-table";
import type { IPaginationInfo } from "@/interfaces/api.interface";

type EntityIndexPageProps<TData> = {
  title: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;

  toolbar?: ReactNode;

  columns: ColumnDef<TData>[];
  data: TData[];
  pagination: IPaginationInfo | null;

  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;

  onCreate: () => void;

  onExport?: (ids?: string[]) => void;
  onDeleteMultiple?: (ids: string[]) => void;

  importAccept?: string;
  onImport?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function EntityIndexPage<TData>({
  title,
  selectedIds,
  onSelectionChange,
  toolbar,
  columns,
  data,
  pagination,
  onPageChange,
  onPerPageChange,
  onCreate,
  onExport,
  onDeleteMultiple,
  importAccept = ".csv",
  onImport,
}: EntityIndexPageProps<TData>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedCount = selectedIds.length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>{title}</CardTitle>
              {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selecionado
                  {selectedCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              {toolbar}

              {onImport && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={importAccept}
                    onChange={onImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Importar"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </>
              )}

              {onExport && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    onExport(selectedCount > 0 ? selectedIds : undefined)
                  }
                  aria-label="Exportar"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {onDeleteMultiple && selectedCount > 0 && (
                <Button
                  variant="outline"
                  type="button"
                  className="text-destructive border-destructive hover:text-destructive"
                  onClick={() => onDeleteMultiple(selectedIds)}
                  aria-label="Excluir selecionados"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <Button type="button" onClick={onCreate} aria-label="Novo">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            page={pagination?.currentPage ?? 1}
            totalPages={pagination?.lastPage ?? 1}
            total={pagination?.total ?? 0}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
            onSelectionChange={onSelectionChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
