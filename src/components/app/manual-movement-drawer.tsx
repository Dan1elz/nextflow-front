import { ManualMovementForm } from "@/components/forms/manual-movement-form";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type {
  LotOptionDto,
  ManualMovementDto,
} from "@/interfaces/manual-movement.interface";
import type { StockMatrixDto } from "@/interfaces/product.interface";
import { handleSuccess } from "@/utils/toast.helpers";

interface ManualMovementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrix: StockMatrixDto;
  decimalPlaces: number;
  tracksLots: boolean;
  loadLotOptions: (
    variantId: string,
    locationId: string
  ) => Promise<LotOptionDto[]>;
  onSubmit: (dto: ManualMovementDto) => Promise<void>;
  onSuccess: () => void;
}

/** T9: ajuste, perda ou saldo de abertura. Correção de um lançamento é outro lançamento, no sentido contrário (RN-CE14). */
export function ManualMovementDrawer({
  open,
  onOpenChange,
  matrix,
  decimalPlaces,
  tracksLots,
  loadLotOptions,
  onSubmit,
  onSuccess,
}: ManualMovementDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-xl overflow-y-auto px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Ajuste de estoque</DrawerTitle>
            <DrawerDescription>
              Saldo de abertura, ajuste ou perda. Para corrigir, lance outro
              movimento no sentido contrário.
            </DrawerDescription>
          </DrawerHeader>
          {open && (
            <ManualMovementForm
              matrix={matrix}
              decimalPlaces={decimalPlaces}
              tracksLots={tracksLots}
              loadLotOptions={loadLotOptions}
              onCancel={() => onOpenChange(false)}
              onSubmit={async (dto) => {
                await onSubmit(dto);
                handleSuccess("Movimentação lançada.");
                onOpenChange(false);
                onSuccess();
              }}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
