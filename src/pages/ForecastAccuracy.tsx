import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { DataTable } from "@/components/app/data-table";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
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
  IForecastAccuracyProduct,
  IForecastAccuracySummary,
} from "@/interfaces/forecast.interface";
import { forecastRunService } from "@/services/forecast-run.service";
import {
  ABC_CLASS_LABELS,
  FORECAST_BIAS_LABELS,
  TForecastBias,
} from "@/types/enums";
import { isAdmin } from "@/utils/auth.helpers";
import { formatMonth } from "@/utils/date.helpers";
import { formatNumber } from "@/utils/format.helpers";

/** Tolerância de acerto (RN-DF26). */
const TOLERANCE_PERCENT = 15;
const ANY = "all";
const BAR_COLOR = "var(--color-primary, #7c3aed)";
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

function formatPercent(value: number) {
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)}%`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ---------- Resumo ----------

function MonthlyChart({ summary }: { summary: IForecastAccuracySummary }) {
  const data = summary.monthly.map((m) => ({
    label: formatMonth(m.month),
    month: m.month,
    mape: m.mapePercent,
    products: m.productsMeasured,
  }));

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload as (typeof data)[number];
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
        <p className="mb-1 font-semibold">{formatMonth(point.month, "long")}</p>
        <p>
          Erro médio:{" "}
          {point.mape === null ? "sem medição" : formatPercent(point.mape)}
        </p>
        <p className="text-muted-foreground">
          {formatNumber(point.products)} produtos medidos
        </p>
      </div>
    );
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => `${formatNumber(value)}%`}
          />
          <Tooltip
            content={renderTooltip}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <ReferenceLine
            xAxisId={0}
            yAxisId={0}
            y={TOLERANCE_PERCENT}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
            label={{
              value: `Tolerância ${TOLERANCE_PERCENT}%`,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <Bar
            dataKey="mape"
            name="Erro médio"
            fill={BAR_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SmallTable({
  label,
  head,
  rows,
}: {
  label: string;
  head: string;
  rows: { key: string; name: string; value: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{label}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem medição.</p>
      ) : (
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              <TableHead>{head}</TableHead>
              <TableHead className="text-right">Erro médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SummaryCard() {
  const { token } = useAuth();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<{
    token: number;
    summary: IForecastAccuracySummary | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    forecastRunService
      .getAccuracySummary(12, token ?? undefined)
      .then(
        (summary) =>
          !ignore && setState({ token: reloadToken, summary, error: null })
      )
      .catch(
        (e: unknown) =>
          !ignore &&
          setState({
            token: reloadToken,
            summary: null,
            error: errorMessage(e, "Erro ao carregar a precisão"),
          })
      );
    return () => {
      ignore = true;
    };
  }, [token, reloadToken]);

  const current = state?.token === reloadToken ? state : null;
  const summary = current?.summary ?? null;
  const measured = summary?.monthly.some((m) => m.mapePercent !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erro médio por mês</CardTitle>
        <CardDescription>
          Últimos 12 meses completos: a projeção feita antes de cada mês contra
          o que foi vendido. Mês com mais de 50% dos dias sem estoque fica fora.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {current?.error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>{current.error}</AlertTitle>
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
        ) : !summary ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Target className="size-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-2xl font-semibold tabular-nums">
                  {summary.withinTolerancePercent === null
                    ? "—"
                    : formatPercent(summary.withinTolerancePercent)}
                </span>
                <span className="text-xs text-muted-foreground">
                  dos produtos dentro de ±{TOLERANCE_PERCENT}% no último mês
                  medido
                </span>
              </div>
            </div>

            {measured ? (
              <MonthlyChart summary={summary} />
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BarChart3 />
                  </EmptyMedia>
                  <EmptyTitle>Ainda sem meses medidos</EmptyTitle>
                  <EmptyDescription>
                    A precisão aparece depois que um mês completo termina com
                    uma análise feita antes dele.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Mês a mês</h3>
                <Table aria-label="Erro médio por mês">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Erro médio</TableHead>
                      <TableHead className="text-right">Produtos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.monthly.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell>{formatMonth(m.month)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.mapePercent === null ? (
                            <Badge variant="outline">Sem medição</Badge>
                          ) : (
                            formatPercent(m.mapePercent)
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(m.productsMeasured)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <SmallTable
                label="Por classe ABC"
                head="Classe"
                rows={summary.byAbcClass.map((c) => ({
                  key: c.abcClass,
                  name:
                    ABC_CLASS_LABELS[
                      c.abcClass as keyof typeof ABC_CLASS_LABELS
                    ] ?? c.abcClass,
                  value: formatPercent(c.mapePercent),
                }))}
              />
              <SmallTable
                label="Por categoria"
                head="Categoria"
                rows={summary.byCategory.map((c) => ({
                  key: c.categoryPath,
                  name: c.categoryPath,
                  value: formatPercent(c.mapePercent),
                }))}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Tabela por produto ----------

const columns: ColumnDef<IForecastAccuracyProduct>[] = [
  {
    id: "productName",
    header: "Produto",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.productName}</span>
    ),
  },
  {
    id: "abcClass",
    header: "Classe",
    cell: ({ row }) =>
      row.original.abcClass ? (
        <Badge variant="outline">{row.original.abcClass}</Badge>
      ) : (
        "—"
      ),
  },
  {
    id: "monthsMeasured",
    header: "Meses medidos",
    cell: ({ row }) => formatNumber(row.original.monthsMeasured),
  },
  {
    id: "mapePercent",
    header: "Erro médio",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatPercent(row.original.mapePercent)}
      </span>
    ),
  },
  {
    id: "lastMonth",
    header: "Último mês",
    cell: ({ row }) => {
      const last = row.original.lastMonth;
      if (!last) return "—";
      return (
        <span className="text-sm tabular-nums">
          {formatMonth(last.month)}: {formatNumber(last.projected)} previsto ×{" "}
          {formatNumber(last.actual)} vendido
        </span>
      );
    },
  },
  {
    id: "bias",
    header: "Tendência",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.bias === TForecastBias.Balanced ? "secondary" : "outline"
        }
      >
        {FORECAST_BIAS_LABELS[row.original.bias]}
      </Badge>
    ),
  },
];

type ProductFilters = { search: string; abcClass: string; bias: string };

function ProductsCard() {
  const { token } = useAuth();
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    abcClass: ANY,
    bias: ANY,
  });
  const [searchText, setSearchText] = useState("");
  const searchTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    items: IForecastAccuracyProduct[];
    total: number;
    error: string | null;
  } | null>(null);

  const queryFilters = useMemo(() => {
    const result: Record<string, string> = {};
    if (filters.search.trim()) result.search = filters.search.trim();
    if (filters.abcClass !== ANY) result.abcClass = filters.abcClass;
    if (filters.bias !== ANY) result.bias = filters.bias;
    return result;
  }, [filters]);
  const key = `${JSON.stringify(queryFilters)}|${page}|${perPage}|${reloadToken}`;

  useEffect(() => {
    let ignore = false;
    forecastRunService
      .getAccuracyProducts(
        { page, perPage, filters: queryFilters },
        token ?? undefined
      )
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
            error: errorMessage(e, "Erro ao carregar a precisão por produto"),
          })
      );
    return () => {
      ignore = true;
    };
  }, [key, page, perPage, queryFilters, token]);

  const changeFilter = (patch: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const selectFilter = (
    id: "abcClass" | "bias",
    label: string,
    labels: Record<string, string>
  ) => (
    <Field className="sm:w-44">
      <FieldLabel htmlFor={`accuracy-${id}`}>{label}</FieldLabel>
      <Select
        value={filters[id]}
        onValueChange={(value) => changeFilter({ [id]: value })}
      >
        <SelectTrigger id={`accuracy-${id}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ANY}>Todas</SelectItem>
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

  const loading = result?.key !== key;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Por produto</CardTitle>
          <CardDescription>
            Erro médio dos meses medidos e se a previsão costuma ficar abaixo
            (subestima) ou acima (superestima) do vendido.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Field className="sm:w-64">
            <FieldLabel htmlFor="accuracy-search">Produto</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                id="accuracy-search"
                value={searchText}
                placeholder="Buscar produto..."
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchText(value);
                  window.clearTimeout(searchTimer.current);
                  searchTimer.current = window.setTimeout(
                    () => changeFilter({ search: value }),
                    400
                  );
                }}
              />
            </InputGroup>
          </Field>
          {selectFilter("abcClass", "Classe", ABC_CLASS_LABELS)}
          {selectFilter("bias", "Tendência", FORECAST_BIAS_LABELS)}
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
        ) : !result ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={result.items}
            page={page}
            totalPages={Math.max(1, Math.ceil(result.total / perPage))}
            total={result.total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Página ----------

/** T-DF10: precisão da previsão (só Admin): resumo dos 12 meses e tabela por produto. */
export function ForecastAccuracyContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = isAdmin(user);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Precisão da previsão
          </h1>
          <p className="text-sm text-muted-foreground">
            Quanto a projeção errou nos meses que já terminaram.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/forecast")}>
          <ArrowLeft data-icon="inline-start" />
          Previsão
        </Button>
      </div>
      {admin ? (
        <>
          <SummaryCard />
          <ProductsCard />
        </>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Acesso restrito</EmptyTitle>
            <EmptyDescription>
              Só administradores veem a precisão da previsão.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

export default function ForecastAccuracyPage() {
  return <ForecastAccuracyContent />;
}
