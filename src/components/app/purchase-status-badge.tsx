import { Badge } from "@/components/ui/badge";
import { PURCHASE_STATUS_LABELS, TPurchaseStatus } from "@/types/enums";

/** Status do pedido de compra (RN-CP07), com "Atrasado" quando a API marca `isLate`. */
export function PurchaseStatusBadge({
  status,
  isLate = false,
}: {
  status: TPurchaseStatus;
  isLate?: boolean;
}) {
  const variant =
    status === TPurchaseStatus.Canceled
      ? "secondary"
      : status === TPurchaseStatus.Budget
        ? "outline"
        : "default";
  return (
    <span className="flex flex-wrap gap-1">
      <Badge variant={variant}>{PURCHASE_STATUS_LABELS[status]}</Badge>
      {isLate && <Badge variant="destructive">Atrasado</Badge>}
    </span>
  );
}
