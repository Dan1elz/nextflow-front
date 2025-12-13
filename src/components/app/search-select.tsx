import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

export interface SearchSelectProps<T> {
  data: T[];
  label?: string;
  field: keyof T;
  placeholder?: string;
  disabled?: boolean;
  onSearch?: (searchTerm: string) => Promise<T[] | void> | T[] | void;
  multiple?: boolean;
  value?: T | T[];
  onChange?: (value: T | T[] | undefined) => void;
  className?: string;
  getOptionLabel?: (item: T) => string;
  getOptionValue?: (item: T) => string | number;
}

export function SearchSelect<T extends Record<string, unknown>>({
  data: initialData,
  label,
  field,
  placeholder = "Selecione....",
  disabled = false,
  onSearch,
  multiple = false,
  value,
  onChange,
  className,
  getOptionLabel,
  getOptionValue,
}: SearchSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<T[]>(initialData);
  const [isSearching, setIsSearching] = React.useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Função para obter o label de um item
  const getLabel = React.useCallback(
    (item: T): string => {
      if (getOptionLabel) {
        return getOptionLabel(item);
      }
      const fieldValue = item[field];
      return fieldValue?.toString() || "";
    },
    [field, getOptionLabel]
  );

  // Função para obter o valor de um item (para comparação)
  const getValue = React.useCallback(
    (item: T): string | number => {
      if (getOptionValue) {
        return getOptionValue(item);
      }
      const fieldValue = item[field];
      return fieldValue?.toString() || "";
    },
    [field, getOptionValue]
  );

  // Verifica se um item está selecionado
  const isSelected = React.useCallback(
    (item: T): boolean => {
      if (!value) return false;
      const itemValue = getValue(item);

      if (multiple && Array.isArray(value)) {
        return value.some((v) => getValue(v) === itemValue);
      } else if (!multiple && !Array.isArray(value)) {
        return getValue(value) === itemValue;
      }
      return false;
    },
    [value, multiple, getValue]
  );

  // Lida com a seleção de um item
  const handleSelect = React.useCallback(
    (item: T) => {
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        const itemValue = getValue(item);
        const isCurrentlySelected = currentValues.some(
          (v) => getValue(v) === itemValue
        );

        let newValues: T[];
        if (isCurrentlySelected) {
          // Remove o item se já estiver selecionado
          newValues = currentValues.filter((v) => getValue(v) !== itemValue);
        } else {
          // Adiciona o item
          newValues = [...currentValues, item];
        }

        onChange?.(newValues.length > 0 ? newValues : undefined);
      } else {
        onChange?.(item);
        setOpen(false);
        setSearchTerm("");
      }
    },
    [multiple, value, onChange, getValue]
  );

  // Remove um item selecionado (apenas para múltipla seleção)
  const handleRemove = React.useCallback(
    (item: T, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!multiple || !Array.isArray(value)) return;

      const itemValue = getValue(item);
      const newValues = value.filter((v) => getValue(v) !== itemValue);
      onChange?.(newValues.length > 0 ? newValues : undefined);
    },
    [multiple, value, onChange, getValue]
  );

  // Limpa a seleção (para seleção única)
  const handleClear = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onChange?.(undefined);
      setOpen(false);
    },
    [onChange]
  );

  // Filtra opções localmente quando não há busca na API
  const filteredOptions = React.useMemo(() => {
    if (onSearch) return data;
    if (!debouncedSearchTerm.trim()) return initialData;
    const lower = debouncedSearchTerm.toLowerCase();
    return initialData.filter((item) => {
      const label = getLabel(item).toLowerCase();
      return label.includes(lower);
    });
  }, [debouncedSearchTerm, initialData, getLabel, onSearch, data]);

  // Atualiza os dados quando filteredOptions muda (busca local)
  React.useEffect(() => {
    if (!onSearch) {
      setData(filteredOptions);
    }
  }, [filteredOptions, onSearch]);

  // Lida com a busca na API
  React.useEffect(() => {
    if (!onSearch) return;

    // Busca na API com debounce
    if (debouncedSearchTerm.trim() === "") {
      setData(initialData);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const performSearch = async () => {
      try {
        const result = await onSearch(debouncedSearchTerm);
        if (result && Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error("Erro ao buscar:", error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, onSearch, initialData]);

  // Renderiza o valor selecionado no trigger
  const renderTriggerContent = () => {
    if (!value) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    if (multiple && Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }
      if (value.length === 1) {
        return <span>{getLabel(value[0])}</span>;
      }
      return <span>{value.length} itens selecionados</span>;
    } else if (!multiple && !Array.isArray(value)) {
      return <span>{getLabel(value)}</span>;
    }

    return <span className="text-muted-foreground">{placeholder}</span>;
  };

  // Verifica se há valor selecionado (para mostrar botão de limpar)
  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value !== undefined && value !== null;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between h-auto min-h-9 py-1 pr-10"
            >
              <div className="flex flex-wrap gap-1 flex-1 min-w-0 text-left">
                {multiple && Array.isArray(value) && value.length > 0
                  ? value.map((item) => (
                      <Badge
                        key={getValue(item)}
                        variant="secondary"
                        className="mr-1"
                      >
                        {getLabel(item)}
                        <button
                          className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRemove(
                                item,
                                e as unknown as React.MouseEvent<HTMLButtonElement>
                              );
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => handleRemove(item, e)}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))
                  : renderTriggerContent()}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          {hasValue && !disabled && !multiple && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-8 top-0.5 h-8 w-8 rounded-full"
              onClick={handleClear}
              aria-label="Limpar seleção"
              type="button"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={!onSearch}>
            <CommandInput
              placeholder="Buscar..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="h-9"
            />
            <CommandList className="max-h-72 overflow-y-auto">
              {isSearching ? (
                <div className="py-6 text-center text-sm">Buscando...</div>
              ) : filteredOptions.length === 0 ? (
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((item) => {
                    const selected = isSelected(item);
                    return (
                      <CommandItem
                        key={getValue(item)}
                        value={getValue(item).toString()}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {getLabel(item)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
