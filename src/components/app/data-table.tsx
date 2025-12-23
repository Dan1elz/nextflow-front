import { useEffect, useState } from "react";
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  disablePagination?: boolean;
  onSelectionChange?: (rows: string[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  totalPages,
  total,
  onPageChange,
  onPerPageChange,
  disablePagination,
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [rowSelection, setRowSelection] = useState({});

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

  const handlePerPageChange = (value: string) => {
    const newPerPage = Number(value);
    setPerPage(newPerPage);
    onPerPageChange?.(newPerPage);
  };

  const { rows: selectedRows } = table.getSelectedRowModel();

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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sem resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards (mobile) */}
      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells();
            const firstCell = cells[1];
            const actionCell = cells[cells.length - 1];
            const otherCells = cells.slice(1, -1);

            return (
              <Card
                key={row.id}
                className="p-2 gap-2 max-w-full"
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between px-2 pb-0">
                  <div className="font-medium text-lg text-left min-w-0 break-all">
                    {flexRender(
                      firstCell.column.columnDef.cell,
                      firstCell.getContext()
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
            <Select value={String(perPage)} onValueChange={handlePerPageChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
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
              {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
