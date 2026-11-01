import { useRef, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/schemas/product.schema";
import { handleError } from "@/utils/toast.helpers";

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
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      handleError(new Error("O tamanho máximo da imagem é 5 MB."));
      return;
    }
    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
      )
    ) {
      handleError(new Error("Formatos aceitos: JPG, PNG e WebP."));
      return;
    }
    onChange(file);
  };

  const handleClick = () => {
    if (disabled || hasImage) return;
    inputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleFileChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Selecionar imagem"
        tabIndex={-1}
      />
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "relative flex size-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-muted/50 transition-colors",
            hasImage
              ? "cursor-default border-solid border-input"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/80",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Pré-visualização do produto"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImagePlus className="size-8" />
              <span className="px-2 text-center text-xs font-medium">
                {placeholder}
              </span>
            </div>
          )}
        </button>
        {previewUrl && !disabled && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-1.5 right-1.5 rounded-full"
            onClick={() => onChange(null)}
            aria-label="Remover imagem"
          >
            <X />
          </Button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Máx. 5 MB • JPG, PNG ou WebP
      </p>
    </div>
  );
}
