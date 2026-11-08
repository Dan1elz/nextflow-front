import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-debounce";
import type { PurchaseVariantOptionDto } from "@/interfaces/purchase-order.interface";
import { formatCurrency } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

interface PurchaseItemPickerProps {
  supplierId: string;
  disabled: boolean;
  /** Por que está travado (mostrado no lugar do placeholder). */
  disabledHint?: string;
  search: (
    supplierId: string,
    search: string,
    onlyLinked: boolean
  ) => Promise<PurchaseVariantOptionDto[]>;
  onSelect: (option: PurchaseVariantOptionDto) => Promise<void>;
}

const isExactCode = (option: PurchaseVariantOptionDto, term: string) => {
  const code = term.toLowerCase();
  return (
    option.sku.toLowerCase() === code || option.barcode?.toLowerCase() === code
  );
};

const optionName = (option: PurchaseVariantOptionDto) =>
  option.variantLabel
    ? `${option.productName} · ${option.variantLabel}`
    : option.productName;

/**
 * Busca de itens do pedido de compra (T-CP2), no estilo da venda rápida: campo sempre visível, lista com foto, SKU,
 * código de barras e custo médio. Por padrão só os produtos do fornecedor; "Todos os produtos" abre o catálogo. SKU ou
 * código de barras exato (de uma opção só) entra sozinho, como no leitor da venda.
 */
export function PurchaseItemPicker({
  supplierId,
  disabled,
  disabledHint,
  search,
  onSelect,
}: PurchaseItemPickerProps) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const debouncedTerm = useDebounce(term, 300);
  const requestKey = `${supplierId}|${showAll}|${debouncedTerm.trim()}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    options: PurchaseVariantOptionDto[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoHandled = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !supplierId || disabled) return;
    let active = true;
    search(supplierId, debouncedTerm.trim(), !showAll)
      .then((options) => active && setLoaded({ key: requestKey, options }))
      .catch((error) => handleError(error, "Erro ao buscar itens"));
    return () => {
      active = false;
    };
  }, [debouncedTerm, disabled, open, requestKey, search, showAll, supplierId]);

  const isLoading = open && loaded?.key !== requestKey;
  const options = loaded?.key === requestKey ? loaded.options : [];

  const choose = async (option: PurchaseVariantOptionDto) => {
    setTerm("");
    setOpen(false);
    autoHandled.current = null;
    await onSelect(option);
    inputRef.current?.focus();
  };

  // Código exato de uma única opção: entra sozinho, sem Enter (leitor ou digitação do SKU).
  useEffect(() => {
    const typed = term.trim();
    if (!typed || isLoading || debouncedTerm.trim() !== typed) return;
    if (autoHandled.current === requestKey) return;
    const exact = options.filter((option) => isExactCode(option, typed));
    if (exact.length !== 1) return;
    autoHandled.current = requestKey;
    void choose(exact[0]);
    // choose é recriada a cada render; o efeito só reage à chegada da busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, debouncedTerm, isLoading, options, requestKey]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const typed = term.trim();
    const exact = options.find((option) => isExactCode(option, typed));
    if (exact) {
      event.preventDefault();
      void choose(exact);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <Popover open={open && !disabled} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div className="rounded-md border">
              <CommandInput
                ref={inputRef}
                value={term}
                onValueChange={(value) => {
                  setTerm(value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={
                  disabled
                    ? (disabledHint ?? "Escolha o fornecedor ao lado")
                    : "Buscar por nome, SKU ou código de barras"
                }
                disabled={disabled}
                aria-label="Buscar item para o pedido"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] min-w-[min(calc(100vw-2rem),22rem)] p-0"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <CommandList className="max-h-80">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Spinner />
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {showAll
                      ? "Nenhuma variação encontrada."
                      : 'Nenhum item deste fornecedor. Ligue "Todos os produtos" para buscar no catálogo.'}
                  </CommandEmpty>
                  <CommandGroup
                    heading={showAll ? "Catálogo" : "Do fornecedor"}
                  >
                    {options.map((option) => (
                      <CommandItem
                        key={option.variantId}
                        value={option.variantId}
                        onSelect={() => void choose(option)}
                        className="cursor-pointer gap-3"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          {option.imageUrl ? (
                            <img
                              src={option.imageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {optionName(option)}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {option.sku}
                            {option.barcode ? ` · ${option.barcode}` : ""}
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {option.averageCost != null && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              médio {formatCurrency(option.averageCost)}
                            </span>
                          )}
                          {!option.isLinked && (
                            <Badge variant="secondary">Sem vínculo</Badge>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>
      <div className="flex items-center gap-2">
        <Switch
          id="purchase-show-all"
          checked={showAll}
          onCheckedChange={setShowAll}
          disabled={disabled}
        />
        <Label htmlFor="purchase-show-all" className="text-sm font-normal">
          Todos os produtos (não só os do fornecedor)
        </Label>
      </div>
    </div>
  );
}
