import { useRef, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/schemas/product.schema";

const ACCEPT_STRING = ACCEPTED_IMAGE_TYPES.join(",");

export interface ImagePickerProps {
  /** URL da imagem (GET) ou File selecionado (POST/PUT). */
  value?: string | File | null;
  onChange: (value: File | null) => void;
  disabled?: boolean;
  className?: string;
  /** Tamanho do quadrado (default: 140). */
  size?: number;
  /** Mensagem quando não há imagem. */
  placeholder?: string;
}

export function ImagePicker({
  value,
  onChange,
  disabled = false,
  className,
  size = 140,
  placeholder = "Selecione uma imagem",
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const hasImage = Boolean(
    value &&
    (typeof value === "string" ? value.trim() !== "" : value instanceof File)
  );

  useEffect(() => {
    if (!value) {
      queueMicrotask(() => setPreviewUrl(null));
      return;
    }
    if (typeof value === "string") {
      queueMicrotask(() => setPreviewUrl(value));
      return;
    }
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      queueMicrotask(() => setPreviewUrl(url));
      return () => URL.revokeObjectURL(url);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onChange(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) return;
    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
      )
    )
      return;
    onChange(file);
    e.target.value = "";
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClick = () => {
    if (disabled) return;
    if (hasImage) return;
    inputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-muted/50 transition-colors",
          hasImage
            ? "border-solid border-input cursor-default"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/80",
          disabled && "cursor-not-allowed opacity-60"
        )}
        style={{ width: size, height: size }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileChange}
          disabled={disabled}
          className={cn(
            "absolute inset-0 z-0 cursor-pointer opacity-0",
            hasImage && "pointer-events-none"
          )}
          aria-label="Selecionar imagem"
        />
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Remover imagem"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
            <span className="text-center text-xs font-medium px-2">
              {placeholder}
            </span>
          </div>
        )}
      </button>
      <p className="text-xs text-muted-foreground">
        Máx. 5MB • JPG, PNG ou WebP
      </p>
    </div>
  );
}
