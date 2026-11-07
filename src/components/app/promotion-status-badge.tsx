import { Badge } from "@/components/ui/badge";
import { PROMOTION_STATUS_LABELS, TPromotionStatus } from "@/types/enums";

const variants: Record<
  TPromotionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [TPromotionStatus.Active]: "default",
  [TPromotionStatus.Scheduled]: "outline",
  [TPromotionStatus.Ended]: "secondary",
  [TPromotionStatus.Canceled]: "secondary",
};

/** Status calculado pela API na data de negócio (RN-VD12). */
export function PromotionStatusBadge({ status }: { status: TPromotionStatus }) {
  return (
    <Badge variant={variants[status]}>{PROMOTION_STATUS_LABELS[status]}</Badge>
  );
}
