import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { SupplierProductDto } from "@/interfaces/supplier.interface";
import { supplierService } from "@/services/supplier.service";
import { LIFECYCLE_LABELS, TLifecycle } from "@/types/enums";
import { formatCurrency, formatNumber } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

/**
 * Aba Produtos do fornecedor: os produtos vinculados no cadastro do produto (aba Fornecedores), com o SKU, o prazo
 * efetivo, as regras de compra e o último custo do recebimento. A linha abre o produto.
 */
export function SupplierProductsTab({ supplierId }: { supplierId: string }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [products, setProducts] = useState<SupplierProductDto[] | null>(null);

  useEffect(() => {
    let active = true;
    supplierService
      .getProducts(supplierId, token ?? undefined)
      .then((data) => active && setProducts(data))
      .catch((error) => {
        handleError(error, "Erro ao buscar produtos do fornecedor");
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, [supplierId, token]);

  if (!products) return <Skeleton className="h-40 w-full" />;
  if (products.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyDescription>
            Nenhum produto vinculado. O vínculo é feito na aba Fornecedores do
            cadastro do produto.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>SKU no fornecedor</TableHead>
            <TableHead className="text-right">Prazo (dias)</TableHead>
            <TableHead className="text-right">Pedido mínimo</TableHead>
            <TableHead className="text-right">Múltiplo</TableHead>
            <TableHead className="text-right">Último custo</TableHead>
            <TableHead>Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.productId}
              className="cursor-pointer"
              onClick={() => navigate(`/products/${product.productId}/view`)}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{product.productName}</span>
                  {product.brand && (
                    <span className="text-muted-foreground text-xs">
                      {product.brand}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{product.supplierSku ?? "-"}</TableCell>
              <TableCell className="text-right">
                {product.leadTimeDays}
              </TableCell>
              <TableCell className="text-right">
                {product.minOrderQty != null
                  ? formatNumber(product.minOrderQty)
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                {product.orderMultiple != null
                  ? formatNumber(product.orderMultiple)
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                {product.lastCost != null
                  ? formatCurrency(product.lastCost)
                  : "-"}
              </TableCell>
              <TableCell>
                <span className="flex flex-wrap gap-1">
                  {product.isPreferred && <Badge>Preferencial</Badge>}
                  {!product.productIsActive && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                  {product.productIsActive &&
                    product.lifecycle !== TLifecycle.Active && (
                      <Badge variant="outline">
                        {LIFECYCLE_LABELS[product.lifecycle]}
                      </Badge>
                    )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
