import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockAvailability } from "@/hooks/use-variant-sale-options";
import type { VariantSaleOptionDto } from "@/interfaces/sale-option.interface";
import { formatNumber } from "@/utils/format.helpers";
import { SALE_UNIT_SHORT } from "@/utils/product.helpers";

interface StockShortageDialogProps {
  /** Opção sem disponível no local de venda; `null` fecha o aviso. */
  option: VariantSaleOptionDto | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Aviso de falta (T-VD1a): a variação não tem disponível no local de venda e o produto não permite negativo (RN-CE32).
 * Mostra onde há saldo na empresa, mesma loja primeiro. "Transferir agora" (F1.9) e "Cliente procurou" (F2.2) entram
 * nas fatias delas.
 */
export function StockShortageDialog({
  option,
  onOpenChange,
}: StockShortageDialogProps) {
  const { availability, isLoading } = useStockAvailability(
    option?.variantId ?? null,
    option?.locationId ?? null
  );
  const unit = option ? SALE_UNIT_SHORT[option.saleUnit] : "";
  const rows = availability?.byLocation ?? [];

  return (
    <Dialog open={!!option} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sem estoque no local de venda</DialogTitle>
          <DialogDescription>
            {option
              ? `${option.productName}${option.variantLabel ? ` · ${option.variantLabel}` : ""} (${option.sku}) não tem disponível aqui e não pode ficar negativo.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nenhum outro local tem saldo</EmptyTitle>
              <EmptyDescription>
                A variação está zerada em toda a empresa.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            <Alert>
              <AlertTitle>Há saldo em outros locais</AlertTitle>
              <AlertDescription>
                Transfira para o local de venda antes de vender.
              </AlertDescription>
            </Alert>
            <ItemGroup className="gap-2">
              {rows.map((row) => (
                <Item key={row.locationId} variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle>{row.locationName}</ItemTitle>
                    <ItemDescription>{row.storeName}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {row.sameStore && (
                      <Badge variant="secondary">Mesma loja</Badge>
                    )}
                    <span className="text-sm font-medium tabular-nums">
                      {formatNumber(row.available, option?.decimalPlaces ?? 0)}{" "}
                      {unit}
                    </span>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
