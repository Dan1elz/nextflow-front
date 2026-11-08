import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ImageIcon } from "lucide-react";

import { StockShortageDialog } from "@/components/app/stock-shortage-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useVariantSaleOptions } from "@/hooks/use-variant-sale-options";
import type { VariantSaleOptionDto } from "@/interfaces/sale-option.interface";
import { TLifecycle } from "@/types/enums";
import {
  formatCurrency,
  formatDateOnly,
  formatNumber,
} from "@/utils/format.helpers";
import { SALE_UNIT_SHORT } from "@/utils/product.helpers";

interface VariantSalePickerProps {
  /** Local de venda; sem ele, a API usa o local de venda padrão da loja do topo. */
  locationId?: string;
  /** Variação escolhida (a tela de venda soma 1 ao carrinho). */
  onSelect: (option: VariantSaleOptionDto) => void;
  disabled?: boolean;
  placeholder?: string;
}

const isExactCode = (option: VariantSaleOptionDto, term: string) => {
  const code = term.toLowerCase();
  return (
    option.barcode?.toLowerCase() === code || option.sku.toLowerCase() === code
  );
};

/**
 * Seletor de venda (T-VD1): busca por nome, SKU ou código de barras na loja do topo. O leitor digita o código e manda
 * Enter: código exato (SKU ou código de barras) escolhe direto e o foco fica na busca para o próximo. Sem código exato,
 * o Enter não pega o primeiro da lista: avisa e deixa o termo selecionado, para a próxima leitura substituir. Só depois
 * de navegar com as setas o Enter escolhe o item destacado. Opção sem disponível de produto que não permite negativo (RN-CE32) abre o aviso
 * de falta (T-VD1a) em vez de entrar no carrinho. Preço efetivo e disponível vêm da API.
 */
export function VariantSalePicker({
  locationId,
  onSelect,
  disabled,
  placeholder = "Buscar por nome, SKU ou código de barras",
}: VariantSalePickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  // Objeto novo a cada Enter: o mesmo código lido duas vezes gera dois pendentes distintos.
  const [pendingEnter, setPendingEnter] = useState<{ term: string } | null>(
    null
  );
  const handledEnter = useRef<{ term: string } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Setas desde a última digitação: aí o Enter é do item destacado na lista, não de um código.
  const navigated = useRef(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [shortage, setShortage] = useState<VariantSaleOptionDto | null>(null);
  const { storeId, options, term, isLoading } = useVariantSaleOptions(
    search,
    locationId,
    open
  );

  const choose = (option: VariantSaleOptionDto) => {
    setOpen(false);
    setSearch("");
    setPendingEnter(null);
    setNotFound(null);
    navigated.current = false;
    inputRef.current?.focus();
    if (option.availableQuantity <= 0 && !option.allowsNegative) {
      setShortage(option);
      return;
    }
    onSelect(option);
  };

  // Enter do leitor antes de a busca responder: escolhe quando a lista do mesmo código chegar. Fica num efeito (nunca
  // no render) e o ref garante que cada Enter resolve uma vez só, mesmo que o efeito rode de novo (StrictMode).
  useEffect(() => {
    if (!pendingEnter || isLoading || term !== pendingEnter.term) return;
    if (handledEnter.current === pendingEnter) return;
    handledEnter.current = pendingEnter;
    setPendingEnter(null);
    const exact = options.find((option) => isExactCode(option, term));
    if (exact) choose(exact);
    else warnNotFound(term);
    // choose e warnNotFound são recriadas a cada render; o efeito só reage à chegada da busca do código pendente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEnter, isLoading, term, options]);

  // Código sem correspondência exata: fecha a lista, avisa e seleciona o termo (a próxima leitura o substitui).
  const warnNotFound = (code: string) => {
    setOpen(false);
    setNotFound(code);
    inputRef.current?.select();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      navigated.current = true;
      return;
    }
    if (event.key !== "Enter") return;
    const typed = search.trim();
    if (!typed) return;
    if (isLoading || term !== typed) {
      event.preventDefault();
      setPendingEnter({ term: typed });
      return;
    }
    const exact = options.find((option) => isExactCode(option, typed));
    if (exact) {
      event.preventDefault();
      choose(exact);
      return;
    }
    // Escolheu com as setas: o Command escolhe o destacado.
    if (navigated.current && open && options.length > 0) return;
    event.preventDefault();
    warnNotFound(typed);
  };

  return (
    <>
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <Popover open={open && !!storeId} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div ref={anchorRef} className="rounded-md border">
              <CommandInput
                ref={inputRef}
                value={search}
                onValueChange={(value) => {
                  setSearch(value);
                  setOpen(true);
                  setNotFound(null);
                  navigated.current = false;
                }}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={
                  storeId ? placeholder : "Selecione uma loja no topo"
                }
                disabled={disabled || !storeId}
                aria-label="Buscar produto para venda"
                aria-describedby={
                  notFound ? "sale-picker-not-found" : undefined
                }
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] min-w-[min(calc(100vw-2rem),22rem)] p-0"
            onOpenAutoFocus={(event) => event.preventDefault()}
            // Clique no próprio campo não é "fora": sem isso o Radix fecha a lista no pointerdown e ela só voltava ao digitar.
            onInteractOutside={(event) => {
              if (anchorRef.current?.contains(event.target as Node))
                event.preventDefault();
            }}
          >
            <CommandList>
              {isLoading && options.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Spinner />
                  Buscando…
                </div>
              ) : (
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              )}
              {options.length > 0 && (
                <CommandGroup heading="Produtos">
                  {options.map((option) => (
                    <CommandItem
                      key={option.variantId}
                      value={option.variantId}
                      onSelect={() => choose(option)}
                    >
                      <SaleOptionRow option={option} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>
      {notFound && (
        <p
          id="sale-picker-not-found"
          role="alert"
          className="-mt-2 px-1 text-sm text-destructive"
        >
          Nenhum produto com o código {notFound}. Confira o código ou escolha na
          lista.
        </p>
      )}

      <StockShortageDialog
        option={shortage}
        onOpenChange={(isOpen) => {
          if (!isOpen) setShortage(null);
        }}
      />
    </>
  );
}

function SaleOptionRow({ option }: { option: VariantSaleOptionDto }) {
  const hasDiscount = option.effectivePrice < option.listPrice;
  const outOfStock = option.availableQuantity <= 0;

  return (
    <div className="flex w-full items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
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

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium">
          {option.productName}
          {option.variantLabel && (
            <span className="text-muted-foreground">
              {" "}
              · {option.variantLabel}
            </span>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {option.sku}
          {option.nextLot &&
            ` · Lote ${option.nextLot.code} (vence ${formatDateOnly(option.nextLot.expiresOn)})`}
        </span>
        <div className="flex flex-wrap gap-1">
          {outOfStock && <Badge variant="destructive">Sem estoque aqui</Badge>}
          {!option.isActive && <Badge variant="outline">Inativa</Badge>}
          {option.lifecycle === TLifecycle.Discontinued && (
            <Badge variant="outline">Fora de linha</Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <span className="font-medium tabular-nums">
          {formatCurrency(option.effectivePrice)}
        </span>
        {hasDiscount && (
          <span className="text-xs text-muted-foreground tabular-nums">
            <span className="line-through">
              {formatCurrency(option.listPrice)}
            </span>
            {option.activePromotion &&
              ` −${formatNumber(option.activePromotion.discountPercent)}%`}
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(option.availableQuantity, option.decimalPlaces)}{" "}
          {SALE_UNIT_SHORT[option.saleUnit]}
        </span>
      </div>
    </div>
  );
}
