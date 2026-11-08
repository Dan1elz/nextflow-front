import { type LucideIcon, UserRound, UserRoundCheck } from "lucide-react";

import { OrderStatusBadge } from "@/components/app/order-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderDetailDto } from "@/interfaces/quick-sale.interface";
import { PAYMENT_METHOD_LABELS } from "@/types/enums";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/utils/format.helpers";
import { PAYMENT_ICONS } from "@/utils/payment.helpers";

function SummaryLine({
  label,
  value,
  className,
  sign,
}: {
  label: string;
  value: number;
  className?: string;
  /** "-" mostra o valor como abatimento (desconto, troco). */
  sign?: "-";
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${className ?? ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">
        {sign === "-" && value > 0 ? "− " : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-medium">{value}</div>
        {hint && (
          <div className="truncate text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Detalhe da venda (T-VD5): itens, pagamentos e totais como a API gravou. Cores com significado: descontos em vermelho
 * (abatimento), pagamentos em verde (dinheiro que entrou) e o total em destaque na cor da marca.
 */
export function SaleDetailDialog({
  sale,
  onClose,
}: {
  sale: OrderDetailDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={sale != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {sale && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Venda nº {sale.number}
                <OrderStatusBadge status={sale.status} />
              </DialogTitle>
              <DialogDescription>
                {formatDateTime(sale.paidAt ?? sale.createdAt)}
                {sale.store ? ` · ${sale.store.name}` : ""}
                {sale.saleLocation ? ` › ${sale.saleLocation.name}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoBlock
                icon={UserRound}
                label="Cliente"
                value={sale.client?.name ?? "Consumidor final"}
                hint={sale.client?.cpf ? `CPF ${sale.client.cpf}` : null}
              />
              <InfoBlock
                icon={UserRoundCheck}
                label="Vendedor"
                value={sale.user?.name ?? "-"}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {item.productName}
                        {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                        {item.promotion && (
                          <Badge variant="destructive" className="font-normal">
                            −{formatNumber(item.promotion.discountPercent)}%
                            promoção
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(item.quantity, item.decimalPlaces)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${item.discount > 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {item.discount > 0
                        ? `− ${formatCurrency(item.discount)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="grid content-start gap-3 rounded-xl border p-4">
                <span className="font-medium">Pagamentos</span>
                {sale.payments.map((payment) => {
                  const Icon = PAYMENT_ICONS[payment.method];
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="size-4 text-success" />
                        {PAYMENT_METHOD_LABELS[payment.method]}
                      </span>
                      <span className="font-medium text-success tabular-nums">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  );
                })}
                {(sale.cashReceived != null ||
                  (sale.change != null && sale.change > 0)) && <Separator />}
                {sale.cashReceived != null && (
                  <SummaryLine
                    label="Recebido em dinheiro"
                    value={sale.cashReceived}
                    className="text-muted-foreground"
                  />
                )}
                {sale.change != null && sale.change > 0 && (
                  <SummaryLine
                    label="Troco"
                    value={sale.change}
                    sign="-"
                    className="text-muted-foreground"
                  />
                )}
              </div>
              <div className="grid content-start gap-3 rounded-xl border p-4">
                <span className="font-medium">Resumo</span>
                <SummaryLine label="Subtotal" value={sale.subtotal} />
                <SummaryLine
                  label="Descontos"
                  value={sale.discountTotal}
                  sign="-"
                  className={
                    sale.discountTotal > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                />
                <Separator />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-semibold text-primary tabular-nums">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
