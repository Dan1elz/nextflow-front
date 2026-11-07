import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, TOrderStatus } from "@/types/enums";

/** Status da venda (RN-VD16): paga em destaque, orçamento contornado, o resto apagado. */
export function OrderStatusBadge({ status }: { status: TOrderStatus }) {
  const variant =
    status === TOrderStatus.Paid
      ? "default"
      : status === TOrderStatus.Budget
        ? "outline"
        : "secondary";
  return <Badge variant={variant}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
