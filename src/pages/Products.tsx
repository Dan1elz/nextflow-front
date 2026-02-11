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
import { useProducts } from "@/hooks/use-products";
import type { IProduct } from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import { formatCurrency, formatDateOnly, formatNumber } from "@/utils";
import { UNIT_TYPE_LABELS, type TUnitType } from "@/types/enums";

function Products() {
  const navigate = useNavigate();
  const { products, pagination, searchProducts, deleteProduct } = useProducts();
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSearched = useRef(false);

  const searchProductsRef = useRef(searchProducts);
  const perPageRef = useRef(perPage);

  useEffect(() => {
    searchProductsRef.current = searchProducts;
  }, [searchProducts]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const handleSearch = useCallback((page = 1) => {
    searchProductsRef
      .current({
        filters: {},
        page,
        perPage: perPageRef.current,
      })
      .catch((error) => {
        handleError(error, "Erro desconhecido ao buscar produtos");
      });
  }, []);

  const handlePageChange = (page: number) => handleSearch(page);

  const handleCreate = () => navigate("/products/create");

  const handleEdit = useCallback(
    (product: IProduct) => {
      if (product.id) {
        navigate(`/products/${product.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (product: IProduct) => {
      if (product.id) {
        navigate(`/products/${product.id}/view`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (product: IProduct) => {
      if (!product.id) return;

      try {
        await deleteProduct(product.id);
        handleSuccess("Produto excluído com sucesso");
        handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir produto");
      }
    },
    [deleteProduct, handleSearch]
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
      searchProductsRef
        .current({
          filters: {},
          page: 1,
          perPage,
        })
        .catch((error) =>
          handleError(error, "Erro desconhecido ao buscar produtos")
        );
    } else {
      hasSearched.current = true;
      handleSearch(1);
    }
  }, [perPage, handleSearch]);

  const columns = useMemo<ColumnDef<IProduct>[]>(
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
        id: "image",
        header: "Imagem",
        cell: ({ row }) => {
          const img = row.original.image;
          const src = typeof img === "string" && img.trim() ? img : null;
          return (
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  —
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "productCode",
        header: "Código",
      },
      {
        accessorKey: "name",
        header: "Nome",
      },
      {
        id: "supplier",
        header: "Fornecedor",
        cell: ({ row }) => row.original.supplier?.name ?? "-",
      },
      {
        id: "categories",
        header: "Categorias",
        cell: ({ row }) =>
          row.original.categories?.map((c) => c.description).join(", ") || "-",
      },
      {
        accessorKey: "price",
        header: "Preço",
        cell: ({ row }) => formatCurrency(Number(row.original.price)),
      },
      {
        accessorKey: "quantity",
        header: "Estoque",
        cell: ({ row }) =>
          `${formatNumber(Number(row.original.quantity))} ${
            UNIT_TYPE_LABELS[row.original.unitType as TUnitType] ??
            String(row.original.unitType)
          }`,
      },
      {
        accessorKey: "validity",
        header: "Validade",
        cell: ({ row }) =>
          row.original.validity ? formatDateOnly(row.original.validity) : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        ),
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
              <CardTitle>Produtos</CardTitle>
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
            data={products}
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

export default function ProductsPageWrapper() {
  return (
    <ProductsProvider>
      <Products />
    </ProductsProvider>
  );
}
