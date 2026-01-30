"use client";

import { useState, useEffect, useRef } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const MIN_DATE = new Date(1900, 0, 1);

export function DatePicker({
  value,
  onChange,
  disabled = false,
  minDate = MIN_DATE,
  maxDate = new Date(),
  placeholder = "dd/mm/aaaa",
  className,
  error,
}: DatePickerProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && isValid(new Date(value + "T00:00:00"))) {
      const formattedDate = format(
        new Date(value + "T00:00:00"),
        "dd/MM/yyyy",
        { locale: ptBR }
      );
      setDisplayValue((prev) =>
        formattedDate !== prev.trim() ? formattedDate : prev
      );
    } else if (!value) {
      setDisplayValue("");
    }
  }, [value]);

  const parseDateString = (str: string): Date | undefined => {
    const parsed = parse(str, "dd/MM/yyyy", new Date(), { locale: ptBR });
    return isValid(parsed) ? parsed : undefined;
  };

  const selectedDate =
    value && isValid(new Date(value + "T00:00:00"))
      ? parse(value, "yyyy-MM-dd", new Date())
      : undefined;

  const isDateDisabled = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const min = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate()
    );
    const max = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      maxDate.getDate()
    );
    return day < min || day > max;
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      if (!isDateDisabled(date)) {
        onChange(format(date, "yyyy-MM-dd"));
      }
    } else {
      onChange("");
    }
    setIsPopoverOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const limitedInput = input.length > 8 ? input.slice(0, 8) : input;

    let formattedInput = "";
    if (limitedInput.length > 4) {
      formattedInput = `${limitedInput.slice(0, 2)}/${limitedInput.slice(2, 4)}/${limitedInput.slice(4)}`;
    } else if (limitedInput.length > 2) {
      formattedInput = `${limitedInput.slice(0, 2)}/${limitedInput.slice(2)}`;
    } else {
      formattedInput = limitedInput;
    }

    setDisplayValue(formattedInput);

    if (formattedInput.length === 10) {
      const parsed = parseDateString(formattedInput);
      if (parsed && !isDateDisabled(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
      } else {
        onChange("");
      }
    } else {
      onChange("");
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setDisplayValue("");
    setIsPopoverOpen(false);
    inputRef.current?.focus();
  };

  const [currentMonth, setCurrentMonth] = useState<Date | undefined>(
    selectedDate ?? new Date()
  );

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          <Input
            ref={inputRef}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsPopoverOpen(true)}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "w-full pr-20 pl-9",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {displayValue && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleClear}
                aria-label="Limpar data"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-8 w-8 rounded-full"
                aria-label="Abrir calendário"
              >
                <CalendarIcon
                  className={cn(
                    "h-4 w-4",
                    isPopoverOpen ? "text-foreground" : "text-muted-foreground"
                  )}
                />
              </Button>
            </PopoverTrigger>
          </div>
        </div>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={isDateDisabled}
            captionLayout="dropdown"
            startMonth={minDate}
            endMonth={maxDate}
            autoFocus
            locale={ptBR}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </PopoverContent>
      </div>
    </Popover>
  );
}
