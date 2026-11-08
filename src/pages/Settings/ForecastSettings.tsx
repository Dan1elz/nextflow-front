import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CalendarClock,
  KeyRound,
  RefreshCw,
} from "lucide-react";

import { ConfirmWarningDialog } from "@/components/app/confirm-warning-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useApiForm } from "@/hooks/use-api-form";
import { useAuth } from "@/hooks/use-auth";
import type { IForecastSettings } from "@/interfaces/forecast.interface";
import {
  forecastSettingsSchema,
  type ForecastSettingsFormData,
} from "@/schemas/forecast-settings.schema";
import { forecastRunService } from "@/services/forecast-run.service";
import { formatDateTime } from "@/utils/format.helpers";
import { handleSuccess } from "@/utils/toast.helpers";

/** `weekday` segue o `DayOfWeek` do .NET: 0 = domingo. */
const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function toForm(settings: IForecastSettings): ForecastSettingsFormData {
  return {
    scheduleEnabled: settings.scheduleEnabled,
    weekday: String(settings.weekday),
    time: settings.time,
    aiBatchSize: String(settings.aiBatchSize),
  };
}

function SettingsForm({
  settings,
  onSaved,
}: {
  settings: IForecastSettings;
  onSaved: (settings: IForecastSettings) => void;
}) {
  const { token } = useAuth();
  const form = useForm<ForecastSettingsFormData>({
    resolver: zodResolver(forecastSettingsSchema),
    defaultValues: toForm(settings),
  });
  const { submit, handleSubmit, confirmWarning } = useApiForm(form);
  const { isSubmitting } = form.formState;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        let saved: IForecastSettings | null = null;
        const ok = await submit(async () => {
          saved = await forecastRunService.updateSettings(
            {
              scheduleEnabled: data.scheduleEnabled,
              weekday: Number(data.weekday),
              time: data.time,
              aiBatchSize: Number(data.aiBatchSize),
            },
            token ?? undefined
          );
        });
        if (!ok || !saved) return;
        handleSuccess("Agendamento salvo.");
        onSaved(saved);
        form.reset(toForm(saved));
      })}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="scheduleEnabled"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Switch
                id="scheduleEnabled"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
              <FieldContent>
                <FieldLabel htmlFor="scheduleEnabled">
                  Análise automática
                </FieldLabel>
                <FieldDescription>
                  Desligada, a análise só roda pelo botão "Gerar nova análise".
                </FieldDescription>
              </FieldContent>
            </Field>
          )}
        />

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="weekday"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="weekday">Dia da semana</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="weekday" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {WEEKDAYS.map((label, index) => (
                        <SelectItem key={label} value={String(index)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="time"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="time">Hora</FieldLabel>
                <Input
                  id="time"
                  type="time"
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={isSubmitting}
                />
                <FieldDescription>No fuso da empresa.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="aiBatchSize"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="aiBatchSize">
                Produtos por lote da IA
              </FieldLabel>
              <Input
                id="aiBatchSize"
                type="number"
                min={1}
                max={100}
                inputMode="numeric"
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
                className="sm:max-w-40"
              />
              <FieldDescription>
                De 1 a 100. Lotes menores falham menos; maiores terminam antes.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Salvar
          </Button>
        </div>
      </FieldGroup>
      <ConfirmWarningDialog state={confirmWarning} />
    </form>
  );
}

/** T-DF11: dia e hora da análise automática, liga/desliga, lote da IA e status da chave (nunca a chave). */
export function ForecastSettingsContent() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<IForecastSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;
    forecastRunService
      .getSettings(token ?? undefined)
      .then((loaded) => {
        if (ignore) return;
        setSettings(loaded);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!ignore)
          setError(
            e instanceof Error && e.message
              ? e.message
              : "Erro ao carregar o agendamento"
          );
      });
    return () => {
      ignore = true;
    };
  }, [token, reloadToken]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agendamento da previsão</CardTitle>
          <CardDescription>
            Quando a análise de demanda roda sozinha e quantos produtos vão à IA
            por vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{error}</AlertTitle>
              <AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadToken((n) => n + 1)}
                >
                  <RefreshCw />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : !settings ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    Próxima execução
                  </dt>
                  <dd className="text-sm font-medium">
                    {settings.scheduleEnabled && settings.nextScheduledAt
                      ? formatDateTime(settings.nextScheduledAt)
                      : "Desligada"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <KeyRound className="size-3.5" />
                    Chave da IA
                  </dt>
                  <dd>
                    {settings.aiConfigured ? (
                      <Badge variant="secondary">Configurada</Badge>
                    ) : (
                      <Badge variant="outline">
                        Chave da IA não configurada: a análise roda sem IA
                      </Badge>
                    )}
                  </dd>
                </div>
              </dl>
              <SettingsForm settings={settings} onSaved={setSettings} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForecastSettingsPage() {
  return <ForecastSettingsContent />;
}
