import { useRef, type ChangeEvent, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Trash2, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  /** Abre o registro ao clicar na coluna principal (ex.: o nome do cliente). */
  onRowOpen?: (row: TData) => void;

  /** Quando omitido, o botão "Novo" não é exibido. */
  onCreate?: () => void;

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
  onRowOpen,
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
      <Reveal y={8}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Importar"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="md:hidden">Importar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Importar</TooltipContent>
                </Tooltip>
              </>
            )}

            {onExport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      onExport(selectedCount > 0 ? selectedIds : undefined)
                    }
                    aria-label="Exportar"
                  >
                    <Download className="h-4 w-4" />
                    <span className="md:hidden">Exportar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Exportar</TooltipContent>
              </Tooltip>
            )}

            {onDeleteMultiple && selectedCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="text-destructive border-destructive hover:text-destructive"
                    onClick={() => onDeleteMultiple(selectedIds)}
                    aria-label="Excluir selecionados"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="md:hidden">Excluir selecionados</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  Excluir selecionados
                </TooltipContent>
              </Tooltip>
            )}

            {onCreate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" onClick={onCreate} aria-label="Novo">
                    <Plus className="h-4 w-4" />
                    {/* No celular o botão ocupa a largura toda: só o ícone parecia uma faixa vazia. */}
                    <span className="md:hidden">Novo</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Novo</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.08} y={12}>
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={data}
              page={pagination?.currentPage ?? 1}
              totalPages={pagination?.lastPage ?? 1}
              total={pagination?.total ?? 0}
              perPage={pagination?.perPage}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
              onRowOpen={onRowOpen}
              onSelectionChange={onSelectionChange}
            />
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
