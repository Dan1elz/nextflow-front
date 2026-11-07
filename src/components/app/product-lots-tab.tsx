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
import type { LotBalanceDto } from "@/interfaces/product.interface";
import { formatDateOnly, formatNumber } from "@/utils/format.helpers";

interface ProductLotsTabProps {
  lots: LotBalanceDto[] | null;
  decimalPlaces: number;
  hasVariants: boolean;
}

/** "vence hoje", "vence em 12 dias", "venceu há 3 dias": a API manda os dias contados do dia de negócio. */
function expiryText(lot: LotBalanceDto): string {
  if (lot.daysToExpire === 0) return "vence hoje";
  if (lot.daysToExpire > 0)
    return `vence em ${lot.daysToExpire} ${lot.daysToExpire === 1 ? "dia" : "dias"}`;
  const days = -lot.daysToExpire;
  return `venceu há ${days} ${days === 1 ? "dia" : "dias"}`;
}

/**
 * Aba Lotes do T3 (F1.7): saldo de cada lote por local, do que vence primeiro ao último (a ordem da baixa, FEFO). Vencido
 * (vermelho) e vencendo (amarelo, janela de alerta da API) ganham selo; a quantidade e os dias vêm prontos da API.
 */
export function ProductLotsTab({
  lots,
  decimalPlaces,
  hasVariants,
}: ProductLotsTabProps) {
  if (!lots) return <Skeleton className="h-40 w-full" />;
  if (lots.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyDescription>Nenhum lote com saldo nesta loja.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const showStore = new Set(lots.map((lot) => lot.storeName)).size > 1;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead>
            {hasVariants && <TableHead>Variação</TableHead>}
            <TableHead>Local</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((lot) => (
            <TableRow key={`${lot.lotId}-${lot.locationId}`}>
              <TableCell className="font-medium">{lot.code}</TableCell>
              {hasVariants && (
                <TableCell>{lot.variantLabel || "Padrão"}</TableCell>
              )}
              <TableCell>
                {showStore
                  ? `${lot.storeName} · ${lot.locationName}`
                  : lot.locationName}
              </TableCell>
              <TableCell>{formatDateOnly(lot.expiresOn)}</TableCell>
              <TableCell>
                {lot.isExpired ? (
                  <Badge variant="destructive">{expiryText(lot)}</Badge>
                ) : lot.isExpiringSoon ? (
                  <Badge
                    variant="outline"
                    className="border-amber-200/50 bg-amber-50 text-amber-700 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    {expiryText(lot)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">
                    {expiryText(lot)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(lot.quantity, decimalPlaces)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
