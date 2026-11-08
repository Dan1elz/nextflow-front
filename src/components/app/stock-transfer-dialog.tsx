import { useEffect, useState } from "react";
import { ArrowRight, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import type { StockMatrixDto } from "@/interfaces/product.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import { ApiError } from "@/services/api.service";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { stockTransferService } from "@/services/stock-transfer.service";
import { formatNumber } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

/** Campos do formulário e o campo do 422 da API que cai em cada um. */
const FIELD_OF: Record<string, string> = {
  fromLocationId: "from",
  toLocationId: "to",
  "items[0].quantity": "quantity",
  "items[0].variantId": "variant",
  "items[0].lotId": "quantity",
  note: "note",
};

/**
 * Transferir entre locais (RN-CE62), da aba Estoque do produto: origem, destino (qualquer local ativo da empresa), variação e
 * quantidade. A saída sai por FEFO e a entrada leva os mesmos lotes; o custo médio não muda.
 */
export function StockTransferDialog({
  open,
  onOpenChange,
  matrix,
  decimalPlaces,
  saleUnit,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrix: StockMatrixDto;
  decimalPlaces: number;
  saleUnit: string;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const [locations, setLocations] = useState<LocationOptionDto[]>([]);
  const [variantId, setVariantId] = useState(
    matrix.rows.length === 1 ? matrix.rows[0].variantId : ""
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    purchaseOrderService
      .locationOptions(token ?? undefined)
      .then(setLocations)
      .catch((error) => handleError(error, "Erro ao buscar os locais"));
  }, [open, token]);

  const available = (locationId: string) =>
    matrix.rows
      .find((row) => row.variantId === variantId)
      ?.cells.find((cell) => cell.locationId === locationId)?.available;
  const fromAvailable = from ? available(from) : undefined;

  const label = (location: LocationOptionDto) =>
    `${location.storeName} › ${location.name}`;

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!variantId) next.variant = "Escolha a variação.";
    if (!from) next.from = "Escolha a origem.";
    if (!to) next.to = "Escolha o destino.";
    else if (to === from)
      next.to = "O destino precisa ser diferente da origem.";
    const qty = Number(quantity.replace(",", "."));
    if (!(qty > 0)) next.quantity = "A quantidade precisa ser maior que zero.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const transfer = await stockTransferService.create(
        {
          fromLocationId: from,
          toLocationId: to,
          note: note.trim() || null,
          items: [{ variantId, quantity: qty }],
        },
        token ?? undefined
      );
      handleSuccess(`Transferência nº ${transfer.number} lançada.`, {
        description: `${transfer.fromLocationName} → ${transfer.toLocationName}`,
      });
      onDone();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const mapped: Record<string, string> = {};
        for (const field of error.getErrorFields())
          mapped[FIELD_OF[field] ?? "quantity"] = error
            .getFieldErrors(field)
            .join(" ");
        setErrors(mapped);
      } else handleError(error, "Erro ao transferir");
    } finally {
      setSaving(false);
    }
  };

  const locationSelect = (
    id: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    exclude?: string
  ) => (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger id={id} aria-invalid={!!errors[id]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {locations
            .filter((location) => location.id !== exclude)
            .map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {label(location)}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transferir estoque</DialogTitle>
          <DialogDescription>
            Sai da origem e entra no destino na hora, nos mesmos lotes. O custo
            médio não muda.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          {matrix.rows.length > 1 && (
            <Field data-invalid={!!errors.variant}>
              <FieldLabel htmlFor="variant">Variação</FieldLabel>
              <Select
                value={variantId}
                onValueChange={(v) => v && setVariantId(v)}
              >
                <SelectTrigger id="variant">
                  <SelectValue placeholder="Escolha a variação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {matrix.rows.map((row) => (
                      <SelectItem key={row.variantId} value={row.variantId}>
                        {row.variantLabel || "Padrão"} · {row.sku}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.variant && <FieldError>{errors.variant}</FieldError>}
            </Field>
          )}
          <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <Field data-invalid={!!errors.from}>
              <FieldLabel htmlFor="from">De</FieldLabel>
              {locationSelect("from", from, setFrom, "Origem", to)}
              {fromAvailable != null && (
                <FieldDescription>
                  Disponível: {formatNumber(fromAvailable, decimalPlaces)}
                </FieldDescription>
              )}
              {errors.from && <FieldError>{errors.from}</FieldError>}
            </Field>
            <ArrowRight
              aria-hidden
              className="mx-auto hidden size-4 text-muted-foreground sm:mt-9 sm:block"
            />
            <Field data-invalid={!!errors.to}>
              <FieldLabel htmlFor="to">Para</FieldLabel>
              {locationSelect("to", to, setTo, "Destino", from)}
              {errors.to && <FieldError>{errors.to}</FieldError>}
            </Field>
          </div>
          <Field data-invalid={!!errors.quantity}>
            <FieldLabel htmlFor="transfer-quantity">Quantidade</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="transfer-quantity"
                inputMode="decimal"
                value={quantity}
                aria-invalid={!!errors.quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <InputGroupAddon align="inline-end">{saleUnit}</InputGroupAddon>
            </InputGroup>
            {errors.quantity && <FieldError>{errors.quantity}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.note}>
            <FieldLabel htmlFor="transfer-note">
              Observação (opcional)
            </FieldLabel>
            <Textarea
              id="transfer-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: reposição do salão"
            />
            {errors.note && <FieldError>{errors.note}</FieldError>}
          </Field>
        </FieldGroup>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Spinner data-icon="inline-start" /> : <ArrowRightLeft />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
