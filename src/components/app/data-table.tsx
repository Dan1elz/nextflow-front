import { useEffect, useState, type ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  totalPages: number;
  total?: number;
  /** Tamanho real da página usado na requisição (controlado pela tela). */
  perPage?: number;
  onPageChange: (page: number) => void;
  /** Sem este callback o seletor de itens por página não é exibido. */
  onPerPageChange?: (perPage: number) => void;
  disablePagination?: boolean;
  onSelectionChange?: (rows: string[]) => void;
  /** Quando definido, a coluna principal (a primeira após a seleção) vira um link que abre o registro. */
  onRowOpen?: (row: TData) => void;
}

function OpenLink({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="max-w-full cursor-pointer rounded-md text-left font-medium underline-offset-4 outline-none transition-colors duration-150 hover:text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  disablePagination,
  onSelectionChange,
  onRowOpen,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    globalFilterFn: (row, _, filterValue) => {
      const search = filterValue.toLowerCase();
      return Object.values(row.original as Record<string, unknown>).some(
        (value) => String(value).toLowerCase().includes(search)
      );
    },
  });

  // "de N" e "X de Y" saem do mesmo perPage: Y = ceil(N / perPage), mínimo 1.
  const lastPage =
    total !== undefined && perPage
      ? Math.max(1, Math.ceil(total / perPage))
      : Math.max(1, totalPages);

  const perPageOptions =
    perPage && !PER_PAGE_OPTIONS.includes(perPage)
      ? [...PER_PAGE_OPTIONS, perPage].sort((a, b) => a - b)
      : PER_PAGE_OPTIONS;

  // A tela refaz a busca na página 1 ao trocar o tamanho.
  const handlePerPageChange = (value: string) => {
    onPerPageChange?.(Number(value));
  };

  const { rows: selectedRows } = table.getSelectedRowModel();

  const mainColumnId = table
    .getVisibleLeafColumns()
    .find((column) => column.id !== "select")?.id;

  useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = selectedRows.map(
        (row) => (row.original as { id: string }).id
      );
      onSelectionChange(selectedIds);
    }
  }, [selectedRows, onSelectionChange]);

  useEffect(() => {
    setRowSelection({});
  }, [data]);

  return (
    <div>
      {/* Tabela (desktop) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  className="animate-in fade-in fill-mode-both duration-500"
                  style={{ animationDelay: `${Math.min(rowIndex, 12) * 28}ms` }}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const content = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    );
                    return (
                      <TableCell key={cell.id} className="text-left">
                        {onRowOpen && cell.column.id === mainColumnId ? (
                          <OpenLink onOpen={() => onRowOpen(row.original)}>
                            {content}
                          </OpenLink>
                        ) : (
                          content
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards (mobile) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            // A coluna de seleção é opcional e não aparece no card.
            const cells = row
              .getVisibleCells()
              .filter((cell) => cell.column.id !== "select");
            const firstCell = cells[0];
            const actionCell = cells[cells.length - 1];
            const otherCells = cells.slice(1, -1);

            return (
              <Card
                key={row.id}
                className="p-2 gap-2 max-w-full"
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between px-2 pb-0">
                  <div className="font-medium text-lg text-left min-w-0 flex-1 break-all">
                    {onRowOpen ? (
                      <OpenLink onOpen={() => onRowOpen(row.original)}>
                        {flexRender(
                          firstCell.column.columnDef.cell,
                          firstCell.getContext()
                        )}
                      </OpenLink>
                    ) : (
                      flexRender(
                        firstCell.column.columnDef.cell,
                        firstCell.getContext()
                      )
                    )}
                  </div>
                  <div>
                    {flexRender(
                      actionCell.column.columnDef.cell,
                      actionCell.getContext()
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-1 text-sm px-2 pb-2 text-left">
                  {otherCells.map((cell) => (
                    <div key={cell.id} className="flex flex-row flex-wrap">
                      <span className="font-semibold">
                        {typeof cell.column.columnDef.header === "string"
                          ? cell.column.columnDef.header
                          : cell.column.columnDef.id}
                        :&nbsp;
                      </span>
                      <span className="min-w-0 break-all">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Sem resultados.
          </p>
        )}
      </div>

      {/* Paginação + Select de Itens por Página */}
      {!disablePagination && (
        <div className="flex justify-center sm:flex-row items-center sm:justify-end gap-3 pt-4">
          {/* Select de itens por página */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {onPerPageChange && (
              <Select
                value={perPage ? String(perPage) : undefined}
                onValueChange={handlePerPageChange}
              >
                <SelectTrigger className="w-[84px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {perPageOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {total !== undefined && <span> de {total}</span>}
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} de {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
