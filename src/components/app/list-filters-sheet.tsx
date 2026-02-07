import type { ReactNode } from "react";
import { Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ListFiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onApply: () => void;
  onClear: () => void;
  children: ReactNode;
  contentClassName?: string;
  triggerAriaLabel?: string;
};

export function ListFiltersSheet({
  open,
  onOpenChange,
  title = "Filtros",
  description,
  onApply,
  onClear,
  children,
  contentClassName,
  triggerAriaLabel = "Filtros",
}: ListFiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" type="button" aria-label={triggerAriaLabel}>
          <Filter className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "w-[320px] max-w-[90vw] sm:w-[380px] sm:max-w-none",
          contentClassName
        )}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-4">{children}</div>

        <SheetFooter>
          <Button type="button" onClick={onApply}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Limpar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
