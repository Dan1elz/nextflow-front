import { PackageMinus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  /** "Dar baixa": abre o ajuste de estoque já preenchido com o lote. Sem ela, a coluna não aparece. */
  onWriteOff?: (lot: LotBalanceDto) => void;
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
  onWriteOff,
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
  const situation = (lot: LotBalanceDto) =>
    lot.isExpired ? (
      <Badge variant="destructive">{expiryText(lot)}</Badge>
    ) : lot.isExpiringSoon ? (
      <Badge
        variant="outline"
        className="border-warning/40 bg-warning/10 text-warning"
      >
        {expiryText(lot)}
      </Badge>
    ) : (
      <span className="text-muted-foreground">{expiryText(lot)}</span>
    );
  return (
    <>
      {/* Celular: um card por lote, na ordem da baixa (FEFO). */}
      <div className="flex flex-col gap-3 md:hidden">
        {lots.map((lot) => (
          <div
            key={`${lot.lotId}-${lot.locationId}`}
            className="flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{lot.code}</span>
                <span className="text-xs text-muted-foreground">
                  {hasVariants ? `${lot.variantLabel || "Padrão"} · ` : ""}
                  {showStore
                    ? `${lot.storeName} · ${lot.locationName}`
                    : lot.locationName}
                </span>
              </div>
              <span className="text-lg font-semibold tabular-nums">
                {formatNumber(lot.quantity, decimalPlaces)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>Vence {formatDateOnly(lot.expiresOn)}</span>
              {situation(lot)}
            </div>
            {onWriteOff && (
              <Button
                variant={lot.isExpired ? "destructive" : "outline"}
                size="sm"
                onClick={() => onWriteOff(lot)}
              >
                <PackageMinus />
                Dar baixa
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lote</TableHead>
              {hasVariants && <TableHead>Variação</TableHead>}
              <TableHead>Local</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              {onWriteOff && <TableHead className="w-0" />}
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
                <TableCell>{situation(lot)}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(lot.quantity, decimalPlaces)}
                </TableCell>
                {onWriteOff && (
                  <TableCell className="text-right">
                    <Button
                      variant={lot.isExpired ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => onWriteOff(lot)}
                    >
                      <PackageMinus />
                      Dar baixa
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
