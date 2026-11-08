import { useState } from "react";
import { TicketPercent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import type { IForecastRecommendationListItem } from "@/interfaces/forecast.interface";
import { ApiError } from "@/services/api.service";
import { forecastRunService } from "@/services/forecast-run.service";
import { addDaysToDateOnly, getTodayDateOnly } from "@/utils/date.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

const DEFAULT_DISCOUNT = 10;
const DEFAULT_DAYS = 14;

interface Row {
  discount: string;
  days: string;
  error: string | null;
  done: boolean;
}

const toNumber = (value: string) => Number(value.replace(",", "."));

function errorText(error: unknown) {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fieldErrors ?? {}).flat();
    return fields[0] ?? error.message;
  }
  return error instanceof Error ? error.message : "Erro ao promover";
}

/**
 * Promover selecionados (T-DF6 em lote, tela `/forecast/promote`): cada recomendação "Promover" vira uma promoção a partir de
 * hoje, com o desconto e os dias sugeridos pela análise, ajustáveis por linha. Uma chamada por recomendação (a mesma do dialog
 * individual); a que falhar mostra o erro na linha e as outras seguem. Preço abaixo do custo exige marcar a confirmação (RN-VD13).
 */
export function BulkPromoteForm({
  recommendations,
  onClose,
  onDone,
}: {
  recommendations: IForecastRecommendationListItem[];
  /** Voltar sem criar (ou depois de criar parte). */
  onClose: () => void;
  /** Todas criadas. */
  onDone: () => void;
}) {
  const { token } = useAuth();
  const today = getTodayDateOnly();
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      recommendations.map((rec) => [
        rec.id,
        {
          discount: String(rec.suggestedDiscountPercent ?? DEFAULT_DISCOUNT),
          days: String(rec.suggestedPromotionDays ?? DEFAULT_DAYS),
          error: null,
          done: false,
        },
      ])
    )
  );
  const [confirmBelowCost, setConfirmBelowCost] = useState(false);
  const [running, setRunning] = useState(false);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));

  const apply = async () => {
    setRunning(true);
    let ok = 0;
    let failed = 0;
    for (const rec of recommendations) {
      const row = rows[rec.id];
      if (row.done) continue;
      const days = Math.max(1, Math.round(toNumber(row.days)));
      try {
        await forecastRunService.applyPromotion(
          rec.id,
          {
            discountPercent: toNumber(row.discount),
            startDate: today,
            endDate: addDaysToDateOnly(today, days - 1),
            variantIds: null,
            confirmWarnings: confirmBelowCost,
          },
          token ?? undefined
        );
        ok++;
        update(rec.id, { done: true, error: null });
      } catch (error) {
        failed++;
        update(rec.id, {
          error:
            error instanceof ApiError && error.isConfirmation
              ? "Fica abaixo do custo médio: marque a confirmação abaixo."
              : errorText(error),
        });
      }
    }
    setRunning(false);
    if (ok > 0)
      handleSuccess(
        `${ok} ${ok === 1 ? "promoção criada" : "promoções criadas"}.`
      );
    // Tudo certo: sai da tela. Com falha, fica mostrando o erro de cada linha.
    if (failed === 0) onDone();
    else if (ok === 0) handleError(new Error("Nenhuma promoção foi criada."));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="divide-y rounded-xl border">
        {recommendations.map((rec) => {
          const row = rows[rec.id];
          return (
            <div key={rec.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium">
                  {rec.productName}
                </span>
                {row.done && (
                  <span className="text-xs font-medium text-success">
                    Criada
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                <Field>
                  <FieldLabel
                    htmlFor={`promo-discount-${rec.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Desconto
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={`promo-discount-${rec.id}`}
                      inputMode="decimal"
                      value={row.discount}
                      disabled={running || row.done}
                      onChange={(event) =>
                        update(rec.id, { discount: event.target.value })
                      }
                    />
                    <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor={`promo-days-${rec.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Duração
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={`promo-days-${rec.id}`}
                      inputMode="numeric"
                      value={row.days}
                      disabled={running || row.done}
                      onChange={(event) =>
                        update(rec.id, { days: event.target.value })
                      }
                    />
                    <InputGroupAddon align="inline-end">dias</InputGroupAddon>
                  </InputGroup>
                </Field>
              </div>
              {row.error && (
                <span className="text-xs text-destructive">{row.error}</span>
              )}
            </div>
          );
        })}
      </div>

      <Field orientation="horizontal">
        <Checkbox
          id="bulk-promote-below-cost"
          checked={confirmBelowCost}
          onCheckedChange={(value) => setConfirmBelowCost(value === true)}
          disabled={running}
        />
        <FieldLabel htmlFor="bulk-promote-below-cost" className="font-normal">
          Confirmo criar mesmo que o preço fique abaixo do custo médio
        </FieldLabel>
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={running}>
          Voltar
        </Button>
        <Button onClick={() => void apply()} disabled={running}>
          {running ? <Spinner data-icon="inline-start" /> : <TicketPercent />}
          Criar promoções
        </Button>
      </div>
    </div>
  );
}
