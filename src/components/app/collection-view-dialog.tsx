import { LinkedProductsList } from "@/components/app/linked-products-list";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CollectionResponseDto } from "@/interfaces/collection.interface";
import { formatDateOnly } from "@/utils/format.helpers";

/** Visualizar coleção: período e os produtos ativos dela. */
export function CollectionViewDialog({
  collection,
  onClose,
}: {
  collection: CollectionResponseDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={collection != null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {collection && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {collection.name}
                <Badge variant={collection.isActive ? "default" : "secondary"}>
                  {collection.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {collection.startsOn || collection.endsOn
                  ? `${collection.startsOn ? formatDateOnly(collection.startsOn) : "Sem início"} a ${collection.endsOn ? formatDateOnly(collection.endsOn) : "sem fim"}`
                  : "Sem período definido"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                Produtos ({collection.productCount})
              </span>
              <LinkedProductsList
                filters={{ collectionId: collection.id }}
                emptyText="Nenhum produto ativo nesta coleção."
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
