import { useEffect, type ReactNode } from "react";
import { CalendarHeart, CheckCircle2, PackageCheck } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "motion/react";

import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardProvider } from "@/providers/dashboard.provider";
import {
  EXPIRING_LOTS_DAYS,
  UPCOMING_EVENTS_DAYS,
} from "@/services/dashboard.service";
import {
  formatCurrency,
  formatDateOnly,
  formatNumber,
} from "@/utils/format.helpers";
import { formatMonth } from "@/utils/date.helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { easeApple } from "@/components/motion/tokens";
import {
  CountUp,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/motion/primitives";
import { AiRecommendationsCard } from "@/components/app/ai-recommendations-card";
import {
  BlockEmpty,
  BlockError,
  BlockHeader,
  BlockListSkeleton,
} from "@/components/app/dashboard-block";

function formatQty(value: number): string {
  return formatNumber(value, Number.isInteger(value) ? 0 : 2);
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${formatNumber(value, 1)}%`;
}

function formatDaysAhead(days: number): string {
  if (days <= 0) return "vence hoje";
  if (days === 1) return "vence amanhã";
  return `em ${days} dias`;
}

function DashboardHome() {
  const { user } = useAuth();
  const { salesKpis, loading, fetchAll } = useDashboard();

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const month = salesKpis.data?.month;

  return (
    <Reveal className="flex flex-col gap-6" y={8}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Olá, {user?.name || "Usuário"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {month
              ? `Resumo de ${formatMonth(month, "long")}.`
              : "Resumo do mês no Nextflow."}
          </p>
        </div>
        <Button
          onClick={() => void fetchAll()}
          size="sm"
          variant="outline"
          disabled={loading}
          className="self-start md:self-auto"
        >
          {loading && <Spinner />}
          Atualizar dados
        </Button>
      </div>

      <SalesKpis />
      <AiRecommendationsCard />
      <SalesChart />

      <div className="grid gap-10 border-t border-border/70 pt-8 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-border/70">
        <LowStock />
        <ExpiringLots />
        <UpcomingEvents />
      </div>
    </Reveal>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 4 - ((v - min) / span) * (h - 8),
  ]);
  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const [lx, ly] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 h-8 w-28 overflow-visible text-primary"
      aria-hidden
    >
      <motion.path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: easeApple, delay: 0.3 }}
      />
      <motion.circle
        cx={lx}
        cy={ly}
        r={3}
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      />
    </svg>
  );
}

const KPI_STRIP =
  "grid grid-cols-1 gap-y-10 border-y border-border/70 py-9 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border/70";
const KPI_ITEM = "xl:px-8 xl:first:pl-0 xl:last:pr-0";

function SalesKpis() {
  const { salesKpis, salesChart } = useDashboard();
  const { data, loading, error, reload } = salesKpis;

  let content: ReactNode;
  if (loading && !data) {
    content = (
      <div className={KPI_STRIP}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`flex flex-col gap-3 ${KPI_ITEM}`}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  } else if (error || !data) {
    content = (
      <div className="border-y border-border/70 py-6">
        <BlockError
          message={error ?? "Não foi possível carregar as vendas do mês."}
          onRetry={() => void reload()}
        />
      </div>
    );
  } else {
    const comparisons = [
      data.revenueVsLastMonthPercent !== null &&
        `${formatSignedPercent(data.revenueVsLastMonthPercent)} vs mês anterior`,
      data.revenueVsLastYearPercent !== null &&
        `${formatSignedPercent(data.revenueVsLastYearPercent)} vs ano anterior`,
    ].filter(Boolean);

    const kpis = [
      {
        title: "Faturamento",
        value: data.revenue,
        format: formatCurrency,
        note: comparisons.length
          ? comparisons.join(" · ")
          : "Sem base de comparação",
        trend: salesChart.data?.months.map((m) => m.revenue),
      },
      {
        title: "Pedidos pagos",
        value: data.orderCount,
        format: undefined,
        note: "Vendas pagas no mês",
      },
      {
        title: "Ticket médio",
        value: data.averageTicket,
        format: formatCurrency,
        note: "Valor médio por pedido",
      },
      {
        title: "Margem bruta",
        value: data.grossMargin,
        format: formatCurrency,
        note: `${formatNumber(data.grossMarginPercent, 1)}% do faturamento`,
      },
    ];

    content = (
      <Stagger className={KPI_STRIP}>
        {kpis.map(({ title, value, format, note, trend }) => (
          <StaggerItem key={title} className={KPI_ITEM}>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 tabular-nums text-[2.4rem] font-light leading-none tracking-tight">
              <CountUp value={value} format={format} />
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{note}</p>
            {trend && <Sparkline values={trend} />}
          </StaggerItem>
        ))}
      </Stagger>
    );
  }

  return <section aria-label="Vendas do mês">{content}</section>;
}

function SalesChart() {
  const { salesChart } = useDashboard();
  const { data, loading, error, reload } = salesChart;

  const points = (data?.months ?? []).map((m) => ({
    label: formatMonth(m.month),
    revenue: m.revenue,
    revenueLastYear: m.revenueLastYear,
  }));

  return (
    <section aria-label="Faturamento por mês" className="pt-2">
      <BlockHeader
        id="dash-sales-chart-title"
        title="Faturamento por mês"
        description="Últimos meses comparados com o mesmo mês do ano anterior."
      />
      {loading && !data ? (
        <Skeleton className="h-[300px] w-full" />
      ) : error ? (
        <BlockError message={error} onRetry={() => void reload()} />
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary, #2563eb)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary, #2563eb)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="lastYearColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                className="text-xs text-muted-foreground"
                tickFormatter={(value: number) =>
                  formatCurrency(value, "BRL", 0)
                }
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  backdropFilter: "blur(16px)",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-3)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                name="Este ano"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary, #2563eb)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueColor)"
              />
              <Area
                name="Ano anterior"
                type="monotone"
                dataKey="revenueLastYear"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#lastYearColor)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

const COLUMN = "flex flex-col lg:px-8 lg:first:pl-0 lg:last:pr-0";
const ROW = "flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0";

function CountBadge({ count }: { count: number | undefined }) {
  if (!count) return null;
  return <Badge variant="secondary">{count}</Badge>;
}

function LowStock() {
  const { lowStock } = useDashboard();
  const { data, loading, error, reload } = lowStock;

  return (
    <section aria-label="Estoque baixo" className={COLUMN}>
      <BlockHeader
        id="dash-low-stock-title"
        title="Estoque baixo"
        description="Variações com saldo abaixo do mínimo do local."
        aside={<CountBadge count={data?.count} />}
      />
      {loading && !data ? (
        <BlockListSkeleton />
      ) : error ? (
        <BlockError message={error} onRetry={() => void reload()} />
      ) : !data || data.items.length === 0 ? (
        <BlockEmpty icon={<CheckCircle2 />}>
          Nenhuma variação abaixo do mínimo.
        </BlockEmpty>
      ) : (
        <div className="divide-y divide-border/60">
          {data.items.map((item) => (
            <div key={`${item.variantId}-${item.locationName}`} className={ROW}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {item.productName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.variantLabel ? `${item.variantLabel} · ` : ""}
                  {item.locationName}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex flex-col items-end">
                  <span
                    className={`text-sm font-semibold tabular-nums ${item.available <= 0 ? "text-destructive" : ""}`}
                  >
                    {formatQty(item.available)}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    mín. {formatQty(item.minQuantity)}
                  </span>
                </div>
                <Progress
                  value={
                    item.minQuantity > 0
                      ? Math.min(
                          (Math.max(item.available, 0) / item.minQuantity) *
                            100,
                          100
                        )
                      : 0
                  }
                  className="h-1.5 w-14"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ExpiringLots() {
  const { expiringLots } = useDashboard();
  const { data, loading, error, reload } = expiringLots;

  return (
    <section aria-label="Lotes vencendo" className={COLUMN}>
      <BlockHeader
        id="dash-expiring-lots-title"
        title="Lotes vencendo"
        description={
          data && data.count > 0
            ? `Próximos ${EXPIRING_LOTS_DAYS} dias · ${formatCurrency(data.totalCostValue)} em custo`
            : `Próximos ${EXPIRING_LOTS_DAYS} dias.`
        }
        aside={<CountBadge count={data?.count} />}
      />
      {loading && !data ? (
        <BlockListSkeleton />
      ) : error ? (
        <BlockError message={error} onRetry={() => void reload()} />
      ) : !data || data.items.length === 0 ? (
        <BlockEmpty icon={<PackageCheck />}>
          Nenhum lote vence nos próximos {EXPIRING_LOTS_DAYS} dias.
        </BlockEmpty>
      ) : (
        <div className="divide-y divide-border/60">
          {data.items.map((item) => (
            <div key={`${item.lotCode}-${item.locationName}`} className={ROW}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {item.productName}
                  {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Lote {item.lotCode} · {item.locationName} · Qtd.{" "}
                  {formatQty(item.quantity)}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="text-sm font-semibold tabular-nums">
                  {formatDateOnly(item.expiresOn)}
                </span>
                <span
                  className={`text-xs ${item.daysToExpire <= 7 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {formatDaysAhead(item.daysToExpire)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UpcomingEvents() {
  const { upcomingEvents } = useDashboard();
  const { data, loading, error, reload } = upcomingEvents;

  return (
    <section aria-label="Próximas datas" className={COLUMN}>
      <BlockHeader
        id="dash-upcoming-events-title"
        title="Próximas datas"
        description={`Datas comemorativas dos próximos ${UPCOMING_EVENTS_DAYS} dias.`}
      />
      {loading && !data ? (
        <BlockListSkeleton />
      ) : error ? (
        <BlockError message={error} onRetry={() => void reload()} />
      ) : !data || data.length === 0 ? (
        <BlockEmpty icon={<CalendarHeart />}>
          Nenhuma data comemorativa nos próximos {UPCOMING_EVENTS_DAYS} dias.
        </BlockEmpty>
      ) : (
        <div className="divide-y divide-border/60">
          {data.map((event) => (
            <div key={`${event.eventId}-${event.nextDate}`} className={ROW}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {event.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Demanda começa em {formatDateOnly(event.demandStartsOn)}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="text-sm font-semibold tabular-nums">
                  {formatDateOnly(event.nextDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {event.productCount}{" "}
                  {event.productCount === 1 ? "produto" : "produtos"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Home() {
  return (
    <DashboardProvider>
      <DashboardHome />
    </DashboardProvider>
  );
}
