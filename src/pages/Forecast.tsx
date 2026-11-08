import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BrainCircuit,
  Package,
  CalendarClock,
  History,
  Target,
  RefreshCw,
  Search,
  ShoppingCart,
  Tag,
  X,
  Sparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyPromotionDialog } from "@/components/app/apply-promotion-dialog";
import { ApplyPurchaseDialog } from "@/components/app/apply-purchase-dialog";
import { DismissRecommendationDialog } from "@/components/app/dismiss-recommendation-dialog";
import { DataTable } from "@/components/app/data-table";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { RecommendationDetailSheet } from "@/components/app/recommendation-detail-sheet";
import { SearchSelect } from "@/components/app/search-select";
import {
  ActionPill,
  AiAdjustedPill,
  ConfidencePill,
  PriorityPill,
  RecommendationStatusPill,
  RunStatusPill,
} from "@/components/app/recommendation-badges";
import { useAuth } from "@/hooks/use-auth";
import { useForecastRun } from "@/hooks/use-forecast-run";
import type { IOption } from "@/interfaces/api.interface";
import type {
  IForecastRecommendationFilters,
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";
import { ForecastRunProvider } from "@/providers/forecast-run.provider";
import {
  ABC_CLASS_LABELS,
  FORECAST_CONFIDENCE_LABELS,
  FORECAST_TRIGGER_LABELS,
  RECOMMENDATION_ACTION_LABELS,
  RECOMMENDATION_PRIORITY_LABELS,
  RECOMMENDATION_STATUS_LABELS,
  TForecastRunStatus,
  TRecommendationAction,
  TRecommendationStatus,
} from "@/types/enums";
import { isAdmin } from "@/utils/auth.helpers";
import { formatMonth } from "@/utils/date.helpers";
import {
  formatDateOnly,
  formatDateTime,
  formatNumber,
} from "@/utils/format.helpers";
import { formatCoverageDays, formatDiscount } from "@/utils/forecast.helpers";

// ---------- Formatação ----------

function formatQty(rec: IForecastRecommendationListItem, value: number) {
  return `${formatNumber(value, rec.decimalPlaces)} ${rec.saleUnit}`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

function plural(count: number, one: string, many: string) {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

function toOptions<T extends string>(labels: Record<T, string>): IOption[] {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));
}

const STATUS_OPTIONS = toOptions(RECOMMENDATION_STATUS_LABELS);
const PRIORITY_OPTIONS = toOptions(RECOMMENDATION_PRIORITY_LABELS);
const CONFIDENCE_OPTIONS = toOptions(FORECAST_CONFIDENCE_LABELS);
const ABC_OPTIONS = toOptions(ABC_CLASS_LABELS);
const AI_ADJUSTED_OPTIONS: IOption[] = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

/** Filtros do painel lateral (ação e busca ficam fora, na barra da tabela). */
type SheetFilterKey = Exclude<
  keyof IForecastRecommendationFilters,
  "action" | "search"
>;
const SHEET_KEYS: SheetFilterKey[] = [
  "status",
  "priority",
  "confidence",
  "abcClass",
  "categoryId",
  "supplierId",
  "eventId",
  "aiAdjusted",
];

function pickSheetFilters(filters: IForecastRecommendationFilters) {
  return Object.fromEntries(
    SHEET_KEYS.map((key) => [key, filters[key] ?? ""])
  ) as Record<SheetFilterKey, string>;
}

// ---------- Cabeçalho da análise ----------

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border bg-muted/30 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function RunProgress({ progress }: { progress: IForecastRunProgress | null }) {
  const batches = progress?.batches;
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Spinner />
          {batches && batches.total > 0
            ? `Lote ${batches.completed} de ${batches.total}`
            : "Preparando a análise"}
        </span>
        {batches && batches.failed > 0 && (
          <Badge variant="destructive">
            {plural(batches.failed, "lote falhou", "lotes falharam")}
          </Badge>
        )}
      </div>
      <Progress
        value={progress?.percent ?? 0}
        aria-label="Progresso da análise"
      />
      <p className="text-xs text-muted-foreground">
        A análise roda em segundo plano. Pode sair desta tela: o sino avisa
        quando terminar.
      </p>
    </div>
  );
}

function RunHeader({
  run,
  progress,
}: {
  run: IForecastRunSummary;
  progress: IForecastRunProgress | null;
}) {
  const running = run.status === TForecastRunStatus.Running;
  const trigger = FORECAST_TRIGGER_LABELS[run.trigger] ?? run.trigger;
  const period =
    run.horizonStart && run.horizonEnd
      ? `${formatMonth(run.horizonStart)} a ${formatMonth(run.horizonEnd)}`
      : null;
  const { counts, batches } = run;

  return (
    <Card role="region" aria-label="Última análise">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">Última análise</CardTitle>
          <RunStatusPill status={run.status} />
        </div>
        <CardDescription className="flex flex-wrap gap-x-2 gap-y-1">
          <span>{formatDateTime(run.createdAt)}</span>
          <span aria-hidden>·</span>
          <span>
            {trigger}
            {run.requestedByName ? ` por ${run.requestedByName}` : ""}
          </span>
          {period && (
            <>
              <span aria-hidden>·</span>
              <span>
                Horizonte de {plural(run.horizonMonths, "mês", "meses")} (
                {period})
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {running && <RunProgress progress={progress} />}

        {run.status === TForecastRunStatus.Failed && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>A análise falhou</AlertTitle>
            <AlertDescription>
              {run.errorMessage ?? "Tente gerar de novo."}
            </AlertDescription>
          </Alert>
        )}

        {run.status === TForecastRunStatus.CompletedWithoutAi && (
          <Alert>
            <AlertTriangle />
            <AlertTitle>Concluída sem IA</AlertTitle>
            <AlertDescription>
              A IA não respondeu; as recomendações vêm só do cálculo.
            </AlertDescription>
          </Alert>
        )}

        {!running && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Produtos analisados"
              value={formatNumber(run.productsAnalyzed)}
            />
            <Stat
              label="Enviados à IA"
              value={formatNumber(run.productsSentToAi)}
            />
            <Stat label="Duração" value={formatDuration(run.durationMs)} />
            <Stat
              label="Próxima análise"
              value={
                run.nextScheduledAt
                  ? formatDateTime(run.nextScheduledAt)
                  : "Sem agendamento"
              }
            />
          </div>
        )}

        {!running && batches.failed > 0 && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>
              {plural(batches.failed, "lote falhou", "lotes falharam")} de{" "}
              {formatNumber(batches.total)}
            </AlertTitle>
            <AlertDescription>
              Os produtos desses lotes ficaram só com o cálculo, sem a revisão
              da IA.
            </AlertDescription>
          </Alert>
        )}

        {run.summary && (
          <div className="flex gap-3 rounded-xl border bg-muted/30 p-4">
            <BrainCircuit className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Resumo da IA
              </span>
              <p className="text-sm">{run.summary}</p>
            </div>
          </div>
        )}

        {!running && (
          <>
            <Separator />
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{plural(counts.pending, "pendente", "pendentes")}</span>
              <span>{plural(counts.applied, "aplicada", "aplicadas")}</span>
              <span>
                {plural(counts.dismissed, "descartada", "descartadas")}
              </span>
              <span>{plural(counts.expired, "expirada", "expiradas")}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Tabela ----------

function Suggestion({ rec }: { rec: IForecastRecommendationListItem }) {
  if (rec.action === TRecommendationAction.Buy && rec.suggestedQuantity)
    return (
      <span className="font-semibold tabular-nums">
        {formatQty(rec, rec.suggestedQuantity)}
      </span>
    );
  if (
    rec.action === TRecommendationAction.Promote &&
    rec.suggestedDiscountPercent
  )
    return (
      <span className="font-semibold tabular-nums">
        {formatDiscount(rec.suggestedDiscountPercent)}
        {rec.suggestedPromotionDays
          ? ` por ${plural(rec.suggestedPromotionDays, "dia", "dias")}`
          : ""}
      </span>
    );
  // Transferir (origem → destino) entra com a F3.4b; hoje `transfer` vem sempre nulo.
  return <span className="text-muted-foreground">—</span>;
}

function ProductCell({ rec }: { rec: IForecastRecommendationListItem }) {
  return (
    <span className="flex min-w-[200px] items-center gap-3">
      {rec.imageUrl ? (
        <img
          src={rec.imageUrl}
          alt=""
          className="size-10 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <Package className="size-4" />
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{rec.productName}</span>
        <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {rec.categoryPath ?? "Sem categoria"}
          {rec.abcClass && <Badge variant="outline">{rec.abcClass}</Badge>}
        </span>
      </span>
    </span>
  );
}

/** Só "Comprar" pendente entra no dialog T-DF4. */
function isBuyable(rec: IForecastRecommendationListItem) {
  return (
    rec.action === TRecommendationAction.Buy &&
    rec.status === TRecommendationStatus.Pending
  );
}

const selectColumn: ColumnDef<IForecastRecommendationListItem> = {
  id: "select",
  header: ({ table }) => {
    const all = table.getIsAllPageRowsSelected();
    const some = table.getIsSomePageRowsSelected();
    return (
      <Checkbox
        checked={all}
        indeterminate={some && !all}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas"
      />
    );
  },
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      disabled={!isBuyable(row.original)}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={`Selecionar ${row.original.productName}`}
    />
  ),
  enableSorting: false,
};

type RowActions = {
  admin: boolean;
  onBuy: (rec: IForecastRecommendationListItem) => void;
  onPromote: (rec: IForecastRecommendationListItem) => void;
  onDismiss: (rec: IForecastRecommendationListItem) => void;
};

/** Promover é só do Admin (T-DF6); Descartar vale para qualquer pendente (T-DF8). */
function isPromotable(rec: IForecastRecommendationListItem) {
  return (
    rec.action === TRecommendationAction.Promote &&
    rec.status === TRecommendationStatus.Pending
  );
}

function actionsColumn({
  admin,
  onBuy,
  onPromote,
  onDismiss,
}: RowActions): ColumnDef<IForecastRecommendationListItem> {
  return {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const rec = row.original;
      if (rec.status !== TRecommendationStatus.Pending) return null;
      return (
        <div className="flex flex-wrap justify-end gap-1">
          {isBuyable(rec) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBuy(rec)}
              aria-label={`Comprar ${rec.productName}`}
            >
              <ShoppingCart data-icon="inline-start" />
              Comprar
            </Button>
          )}
          {admin && isPromotable(rec) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPromote(rec)}
              aria-label={`Promover ${rec.productName}`}
            >
              <Tag data-icon="inline-start" />
              Promover
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(rec)}
            aria-label={`Descartar ${rec.productName}`}
          >
            <X data-icon="inline-start" />
            Descartar
          </Button>
        </div>
      );
    },
  };
}

const columns: ColumnDef<IForecastRecommendationListItem>[] = [
  {
    id: "productName",
    header: "Produto",
    cell: ({ row }) => <ProductCell rec={row.original} />,
  },
  {
    id: "action",
    header: "Ação",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        <ActionPill action={row.original.action} />
        {row.original.aiAdjusted && <AiAdjustedPill />}
      </div>
    ),
  },
  {
    id: "priority",
    header: "Prioridade",
    cell: ({ row }) => <PriorityPill priority={row.original.priority} />,
  },
  {
    id: "confidence",
    header: "Confiança",
    cell: ({ row }) => <ConfidencePill confidence={row.original.confidence} />,
  },
  {
    id: "stock",
    header: "Estoque",
    cell: ({ row }) => {
      const rec = row.original;
      return (
        <div className="flex flex-col tabular-nums">
          <span>{formatQty(rec, rec.currentStock)}</span>
          {rec.incomingStock > 0 && (
            <span className="text-xs text-muted-foreground">
              +{formatQty(rec, rec.incomingStock)} a chegar
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "coverageDays",
    header: "Cobertura",
    cell: ({ row }) => formatCoverageDays(row.original.coverageDays),
  },
  {
    id: "projectedDemand",
    header: "Demanda no horizonte",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatQty(row.original, row.original.projectedDemand)}
      </span>
    ),
  },
  {
    id: "suggestion",
    header: "Sugestão",
    cell: ({ row }) => <Suggestion rec={row.original} />,
  },
  {
    id: "deadline",
    header: "Comprar até",
    cell: ({ row }) =>
      row.original.deadline ? formatDateOnly(row.original.deadline) : "—",
  },
  {
    id: "preferredSupplierName",
    header: "Fornecedor",
    cell: ({ row }) => row.original.preferredSupplierName ?? "—",
  },
  {
    id: "reasonShort",
    header: "Motivo",
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-[260px] text-sm text-muted-foreground">
        {row.original.reasonShort}
      </p>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <RecommendationStatusPill status={row.original.status} />
    ),
  },
];

const ACTION_TABS: {
  value: string;
  label: string;
  count: (run: IForecastRunSummary) => number;
}[] = [
  {
    value: "all",
    label: "Todas",
    count: ({ counts }) =>
      counts.buy + counts.promote + counts.transfer + counts.hold,
  },
  {
    value: TRecommendationAction.Buy,
    label: RECOMMENDATION_ACTION_LABELS.Buy,
    count: ({ counts }) => counts.buy,
  },
  {
    value: TRecommendationAction.Promote,
    label: RECOMMENDATION_ACTION_LABELS.Promote,
    count: ({ counts }) => counts.promote,
  },
  {
    value: TRecommendationAction.Transfer,
    label: RECOMMENDATION_ACTION_LABELS.Transfer,
    count: ({ counts }) => counts.transfer,
  },
  {
    value: TRecommendationAction.Hold,
    label: RECOMMENDATION_ACTION_LABELS.Hold,
    count: ({ counts }) => counts.hold,
  },
];

function RecommendationsCard({ run }: { run: IForecastRunSummary }) {
  const {
    recommendations,
    total,
    recommendationsLoading,
    recommendationsError,
    reloadRecommendations,
    reloadRun,
    readOnly,
    query,
    setFilters,
    setPage,
    setPerPage,
    filterOptions,
    loadFilterOptions,
  } = useForecastRun();

  const [search, setSearch] = useState(query.filters.search ?? "");
  const searchTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [buying, setBuying] = useState<IForecastRecommendationListItem[]>([]);
  const openBuy = useCallback(
    (recs: IForecastRecommendationListItem[]) => setBuying(recs),
    []
  );
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [promoting, setPromoting] =
    useState<IForecastRecommendationListItem | null>(null);
  const [dismissing, setDismissing] =
    useState<IForecastRecommendationListItem | null>(null);
  const tableColumns = useMemo(
    () =>
      readOnly
        ? columns
        : [
            selectColumn,
            ...columns,
            actionsColumn({
              admin,
              onBuy: (rec) => openBuy([rec]),
              onPromote: setPromoting,
              onDismiss: setDismissing,
            }),
          ],
    [admin, openBuy, readOnly]
  );
  const afterAction = () => {
    void reloadRecommendations();
    void reloadRun();
  };
  const selectedBuyable = recommendations.filter(
    (rec) => selectedIds.includes(rec.id) && isBuyable(rec)
  );
  const [draft, setDraft] = useState(() => pickSheetFilters(query.filters));

  const running = run.status === TForecastRunStatus.Running;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setFilters({ search: value.trim() });
    }, 400);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (open) {
      setDraft(pickSheetFilters(query.filters));
      void loadFilterOptions();
    }
    setSheetOpen(open);
  };

  const filterSelect = (
    key: SheetFilterKey,
    label: string,
    data: IOption[]
  ) => (
    <SearchSelect<IOption>
      field={{
        value: draft[key],
        onChange: (value) =>
          setDraft((prev) => ({ ...prev, [key]: value ? String(value) : "" })),
      }}
      label={label}
      data={data}
      placeholder="Todos"
    />
  );

  const activeSheetFilters = SHEET_KEYS.filter(
    (key) => query.filters[key]
  ).length;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={query.filters.action ?? "all"}
            onValueChange={(value) =>
              setFilters({ action: value === "all" ? "" : value })
            }
          >
            <TabsList className="h-auto flex-wrap">
              {ACTION_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(tab.count(run))}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <InputGroup className="w-full lg:w-[280px]">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Buscar produto..."
                aria-label="Pesquisar produto"
              />
            </InputGroup>

            <ListFiltersSheet
              open={sheetOpen}
              onOpenChange={handleSheetOpenChange}
              description="Filtre as recomendações desta análise."
              triggerAriaLabel={
                activeSheetFilters
                  ? `Filtros (${activeSheetFilters} ativos)`
                  : "Filtros"
              }
              onApply={() => {
                setFilters(draft);
                setSheetOpen(false);
              }}
              onClear={() => {
                setFilters({
                  ...pickSheetFilters({}),
                  status: "Pending",
                });
                setSheetOpen(false);
              }}
            >
              {filterSelect("status", "Status", STATUS_OPTIONS)}
              {filterSelect("priority", "Prioridade", PRIORITY_OPTIONS)}
              {filterSelect("confidence", "Confiança", CONFIDENCE_OPTIONS)}
              {filterSelect("abcClass", "Classe ABC", ABC_OPTIONS)}
              {filterSelect(
                "categoryId",
                "Categoria",
                filterOptions?.categories ?? []
              )}
              {filterSelect(
                "supplierId",
                "Fornecedor preferido",
                filterOptions?.suppliers ?? []
              )}
              {filterSelect(
                "eventId",
                "Evento do horizonte",
                filterOptions?.events ?? []
              )}
              {filterSelect(
                "aiAdjusted",
                "Ajustada pela IA",
                AI_ADJUSTED_OPTIONS
              )}
            </ListFiltersSheet>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {running ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Análise em andamento</EmptyTitle>
              <EmptyDescription>
                As recomendações aparecem aqui quando ela terminar.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : recommendationsError ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>{recommendationsError}</AlertTitle>
            <AlertDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void reloadRecommendations()}
              >
                <RefreshCw />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : recommendationsLoading && recommendations.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedBuyable.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={() => openBuy(selectedBuyable)}>
                  <ShoppingCart data-icon="inline-start" />
                  Comprar selecionados ({selectedBuyable.length})
                </Button>
              </div>
            )}
            <DataTable
              columns={tableColumns}
              data={recommendations}
              page={query.page}
              totalPages={Math.max(1, Math.ceil(total / query.perPage))}
              total={total}
              perPage={query.perPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              onRowOpen={(rec) => setDetailId(rec.id)}
              onSelectionChange={setSelectedIds}
            />
          </div>
        )}
        <RecommendationDetailSheet
          recommendationId={detailId}
          onClose={() => setDetailId(null)}
          onBuy={
            readOnly
              ? undefined
              : (rec) => {
                  setDetailId(null);
                  openBuy([rec]);
                }
          }
          onPromote={
            admin && !readOnly
              ? (rec) => {
                  setDetailId(null);
                  setPromoting(rec);
                }
              : undefined
          }
          onDismiss={
            readOnly
              ? undefined
              : (rec) => {
                  setDetailId(null);
                  setDismissing(rec);
                }
          }
        />
        <ApplyPromotionDialog
          recommendation={promoting}
          onOpenChange={(open) => {
            if (!open) setPromoting(null);
          }}
          onDone={afterAction}
        />
        <DismissRecommendationDialog
          recommendation={dismissing}
          onOpenChange={(open) => {
            if (!open) setDismissing(null);
          }}
          onDone={afterAction}
        />
        <ApplyPurchaseDialog
          open={buying.length > 0}
          onOpenChange={(open) => {
            if (!open) setBuying([]);
          }}
          recommendations={buying}
          onApplied={afterAction}
        />
      </CardContent>
    </Card>
  );
}

// ---------- Página ----------

function GenerateButton() {
  const { run, generating, generate } = useForecastRun();
  const busy = generating || run?.status === TForecastRunStatus.Running;
  return (
    <Button onClick={() => void generate()} disabled={busy}>
      {busy ? <Spinner /> : <Sparkles />}
      {busy ? "Em andamento" : run ? "Gerar nova análise" : "Gerar análise"}
    </Button>
  );
}

export function ForecastContent() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const navigate = useNavigate();
  const {
    run,
    runLoaded,
    runError,
    reloadRun,
    progress,
    conflictMessage,
    readOnly,
  } = useForecastRun();

  const body = useMemo(() => {
    if (!runLoaded)
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      );
    if (runError && !run)
      return (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{runError}</AlertTitle>
          <AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reloadRun()}
            >
              <RefreshCw />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    if (!run)
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BrainCircuit />
            </EmptyMedia>
            <EmptyTitle>Nenhuma análise ainda</EmptyTitle>
            <EmptyDescription>
              A análise calcula a demanda dos próximos meses pelo histórico de
              vendas e a IA prioriza e explica as ações.
            </EmptyDescription>
          </EmptyHeader>
          {!admin && (
            <EmptyContent>
              <p className="text-sm text-muted-foreground">
                Peça a um administrador para gerar a primeira.
              </p>
            </EmptyContent>
          )}
        </Empty>
      );
    return (
      <>
        <RunHeader run={run} progress={progress} />
        <RecommendationsCard run={run} />
      </>
    );
  }, [admin, progress, reloadRun, run, runError, runLoaded]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Previsão de demanda
          </h1>
          <p className="text-sm text-muted-foreground">
            O sistema calcula, a IA interpreta e você decide.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/forecast/history")}
          >
            <History data-icon="inline-start" />
            Histórico
          </Button>
          {admin && (
            <Button
              variant="outline"
              onClick={() => navigate("/forecast/accuracy")}
            >
              <Target data-icon="inline-start" />
              Precisão
            </Button>
          )}
          {admin && (
            <Button
              variant="outline"
              onClick={() => navigate("/settings/forecast")}
            >
              <CalendarClock data-icon="inline-start" />
              Agendamento
            </Button>
          )}
          {admin && runLoaded && !readOnly && <GenerateButton />}
        </div>
      </div>

      {readOnly && run && (
        <Alert>
          <History />
          <AlertTitle>
            Análise de {formatDateTime(run.createdAt)}, só leitura
          </AlertTitle>
          <AlertDescription>
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => navigate("/forecast")}
            >
              Ver a última análise
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {conflictMessage && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>{conflictMessage}</AlertTitle>
        </Alert>
      )}

      {body}
    </div>
  );
}

export default function ForecastPageWrapper() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("run");
  return (
    <ForecastRunProvider key={runId ?? "latest"} runId={runId}>
      <ForecastContent />
    </ForecastRunProvider>
  );
}
