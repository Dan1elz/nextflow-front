import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Option } from "@/interfaces/api.interface";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  /** Nome do filtro, mostrado no botão ("Status"). */
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

/**
 * Filtro de várias opções para a barra da listagem (fora do painel de filtros): aplica a cada clique. Sem nada marcado
 * vale "todos".
 */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => value.includes(option.value));

  const toggle = (optionValue: string) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : // Mantém a ordem das opções, não a dos cliques.
          options
            .map((option) => option.value)
            .filter((item) => item === optionValue || value.includes(item))
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Filtrar por ${label.toLowerCase()}`}
          className={cn("h-10 justify-between gap-2 rounded-xl", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground">{label}</span>
            {selected.length === 0 ? (
              <span>Todos</span>
            ) : selected.length <= 2 ? (
              selected.map((option) => (
                <Badge key={option.value} className="font-normal">
                  {option.label}
                </Badge>
              ))
            ) : (
              <Badge className="font-normal">
                {selected.length} selecionados
              </Badge>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggle(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "size-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="cursor-pointer justify-center text-muted-foreground"
                  >
                    Limpar seleção
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
