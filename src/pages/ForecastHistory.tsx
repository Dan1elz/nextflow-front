import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowLeft, Layers, RefreshCw } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { DatePicker } from "@/components/app/date-picker";
import { RunStatusPill } from "@/components/app/recommendation-badges";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type {
  IForecastAiBatch,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";
import { forecastRunService } from "@/services/forecast-run.service";
import {
  AI_BATCH_STATUS_LABELS,
  FORECAST_RUN_STATUS_LABELS,
  FORECAST_TRIGGER_LABELS,
  TAiBatchStatus,
} from "@/types/enums";
import { formatMonth } from "@/utils/date.helpers";
import { formatDateTime, formatNumber } from "@/utils/format.helpers";

const ANY = "all";

type HistoryFilters = {
  status: string;
  trigger: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: HistoryFilters = {
  status: ANY,
  trigger: ANY,
  from: "",
  to: "",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

function horizonLabel(run: IForecastRunSummary) {
  if (!run.horizonStart || !run.horizonEnd) return "—";
  return `${formatNumber(run.horizonMonths)} meses (${formatMonth(run.horizonStart)} a ${formatMonth(run.horizonEnd)})`;
}

function toQueryFilters(filters: HistoryFilters): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.status !== ANY) result.status = filters.status;
  if (filters.trigger !== ANY) result.trigger = filters.trigger;
  if (filters.from) result.from = filters.from;
  if (filters.to) result.to = filters.to;
  return result;
}

function BatchesDialog({
  run,
  onClose,
}: {
  run: IForecastRunSummary | null;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [loaded, setLoaded] = useState<{
    runId: string;
    batches: IForecastAiBatch[] | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!run) return;
    let ignore = false;
    forecastRunService
      .getBatches(run.id, token ?? undefined)
      .then(
        (batches) =>
          !ignore && setLoaded({ runId: run.id, batches, error: null })
      )
      .catch(
        (e: unknown) =>
          !ignore &&
          setLoaded({
            runId: run.id,
            batches: null,
            error:
              e instanceof Error && e.message
                ? e.message
                : "Erro ao carregar os lotes",
          })
      );
    return () => {
      ignore = true;
    };
  }, [run, token]);

  const current = run && loaded?.runId === run.id ? loaded : null;

  return (
    <Dialog open={run !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="text-left">
          <DialogTitle>Lotes enviados à IA</DialogTitle>
          <DialogDescription>
            {run ? `Análise de ${formatDateTime(run.createdAt)}` : ""}
          </DialogDescription>
        </DialogHeader>
        {!current ? (
          <Skeleton className="h-24 w-full" />
        ) : current.error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>{current.error}</AlertTitle>
          </Alert>
        ) : current.batches && current.batches.length > 0 ? (
          <Table aria-label="Lotes">
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.batches.map((batch) => (
                <TableRow key={batch.batchNumber}>
                  <TableCell>{batch.batchNumber}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(batch.productsCount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge
                        variant={
                          batch.status === TAiBatchStatus.Failed
                            ? "destructive"
                            : "outline"
                        }
                        className="w-fit"
                      >
                        {AI_BATCH_STATUS_LABELS[batch.status] ?? batch.status}
                      </Badge>
                      {batch.errorMessage && (
                        <span className="text-xs text-muted-foreground">
                          {batch.errorMessage}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(batch.durationMs)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta análise não enviou produtos à IA.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** T-DF9: análises anteriores; abrir leva à `/forecast?run=<id>` (só leitura se não for a mais recente). */
export function ForecastHistoryContent() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    items: IForecastRunSummary[];
    total: number;
    error: string | null;
  } | null>(null);
  const [batchesOf, setBatchesOf] = useState<IForecastRunSummary | null>(null);

  const queryFilters = useMemo(() => toQueryFilters(filters), [filters]);
  const key = `${JSON.stringify(queryFilters)}|${page}|${perPage}|${reloadToken}`;

  useEffect(() => {
    let ignore = false;
    forecastRunService
      .getAll({ page, perPage, filters: queryFilters }, token ?? undefined)
      .then(
        (data) =>
          !ignore &&
          setResult({ key, items: data.items, total: data.total, error: null })
      )
      .catch(
        (e: unknown) =>
          !ignore &&
          setResult({
            key,
            items: [],
            total: 0,
            error:
              e instanceof Error && e.message
                ? e.message
                : "Erro ao carregar o histórico",
          })
      );
    return () => {
      ignore = true;
    };
  }, [key, page, perPage, queryFilters, token]);

  const loading = result?.key !== key;
  const changeFilter = (patch: Partial<HistoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const columns = useMemo<ColumnDef<IForecastRunSummary>[]>(
    () => [
      {
        id: "createdAt",
        header: "Data",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "trigger",
        header: "Origem",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{FORECAST_TRIGGER_LABELS[row.original.trigger]}</span>
            {row.original.requestedByName && (
              <span className="text-xs text-muted-foreground">
                {row.original.requestedByName}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "horizon",
        header: "Horizonte",
        cell: ({ row }) => horizonLabel(row.original),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <RunStatusPill status={row.original.status} />,
      },
      {
        id: "products",
        header: "Produtos",
        cell: ({ row }) => (
          <div className="flex flex-col tabular-nums">
            <span>
              {formatNumber(row.original.productsAnalyzed)} analisados
            </span>
            <span className="text-xs text-muted-foreground">
              {formatNumber(row.original.productsSentToAi)} enviados à IA
            </span>
          </div>
        ),
      },
      {
        id: "batches",
        header: "Lotes",
        cell: ({ row }) => {
          const { batches } = row.original;
          return (
            <div className="flex flex-col tabular-nums">
              <span>
                {formatNumber(batches.completed)} de{" "}
                {formatNumber(batches.total)}
              </span>
              {batches.failed > 0 && (
                <span className="text-xs text-destructive">
                  {formatNumber(batches.failed)} com falha
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "counts",
        header: "Ações",
        cell: ({ row }) => {
          const { counts } = row.original;
          return (
            <div className="flex flex-col text-xs tabular-nums">
              <span>
                Comprar {counts.buy} · Promover {counts.promote} · Manter{" "}
                {counts.hold}
              </span>
              <span className="text-muted-foreground">
                {counts.applied} aplicadas · {counts.dismissed} descartadas
              </span>
            </div>
          );
        },
      },
      {
        id: "duration",
        header: "Duração",
        cell: ({ row }) => formatDuration(row.original.durationMs),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBatchesOf(row.original)}
            aria-label={`Lotes da análise de ${formatDateTime(row.original.createdAt)}`}
          >
            <Layers data-icon="inline-start" />
            Lotes
          </Button>
        ),
      },
    ],
    []
  );

  const selectFilter = (
    id: "status" | "trigger",
    label: string,
    labels: Record<string, string>
  ) => (
    <Field className="sm:w-48">
      <FieldLabel htmlFor={`history-${id}`}>{label}</FieldLabel>
      <Select
        value={filters[id]}
        onValueChange={(value) => changeFilter({ [id]: value })}
      >
        <SelectTrigger id={`history-${id}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ANY}>Todos</SelectItem>
            {Object.entries(labels).map(([value, text]) => (
              <SelectItem key={value} value={value}>
                {text}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Histórico de análises</CardTitle>
              <CardDescription>
                Abra uma análise para ver as recomendações dela.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/forecast")}>
              <ArrowLeft data-icon="inline-start" />
              Última análise
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {selectFilter("status", "Status", FORECAST_RUN_STATUS_LABELS)}
            {selectFilter("trigger", "Origem", FORECAST_TRIGGER_LABELS)}
            <Field className="sm:w-44">
              <FieldLabel>De</FieldLabel>
              <DatePicker
                value={filters.from}
                onChange={(value) => changeFilter({ from: value })}
              />
            </Field>
            <Field className="sm:w-44">
              <FieldLabel>Até</FieldLabel>
              <DatePicker
                value={filters.to}
                onChange={(value) => changeFilter({ to: value })}
              />
            </Field>
            {Object.keys(queryFilters).length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {result?.error && !loading ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{result.error}</AlertTitle>
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
          ) : loading && !result ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={result?.items ?? []}
              page={page}
              totalPages={Math.max(
                1,
                Math.ceil((result?.total ?? 0) / perPage)
              )}
              total={result?.total ?? 0}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
              onRowOpen={(run) => navigate(`/forecast?run=${run.id}`)}
            />
          )}
        </CardContent>
      </Card>
      <BatchesDialog run={batchesOf} onClose={() => setBatchesOf(null)} />
    </div>
  );
}

export default function ForecastHistoryPage() {
  return <ForecastHistoryContent />;
}
