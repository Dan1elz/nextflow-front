import { useEffect, type ReactNode } from "react";
import {
  AlertTriangle,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
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

import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardProvider } from "@/providers/dashboard.provider";
import { formatCurrency, formatDateOnly } from "@/utils/format.helpers";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { easeApple } from "@/components/motion/tokens";
import {
  CountUp,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/motion/primitives";
import { AiRecommendationsCard } from "@/components/app/ai-recommendations-card";
import type { IDashboardStats } from "@/interfaces/dashboard.interface";

const DEFAULT_STOCK_THRESHOLD = 15;

function DashboardHome() {
  const { user } = useAuth();
  const { stats, loading, fetchStats } = useDashboard();

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
            <CheckCircle2 className="h-3 w-3" /> Recebido
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
            <Clock className="h-3 w-3" /> Pendente
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30">
            <XCircle className="h-3 w-3" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30">
            <Calendar className="h-3 w-3" /> Orçamento
          </span>
        );
    }
  };

  return (
    <Reveal className="flex flex-col gap-6" y={8}>
      {/* Cabeçalho de Boas-vindas */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Olá, {user?.name || "Usuário"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aqui está um resumo em tempo real do sistema Nextflow.
          </p>
        </div>
        <Button
          onClick={() => void fetchStats()}
          size="sm"
          variant="outline"
          disabled={loading}
        >
          Atualizar Dados
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando painel...
          </p>
        </div>
      ) : !stats ? (
        <div className="flex flex-col items-center justify-center gap-1 border-y border-border/70 py-14 text-center">
          <AlertTriangle className="mb-3 size-8 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Sem dados</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Não foi possível carregar as informações do painel.
          </p>
          <Button onClick={() => void fetchStats()} size="sm">
            Recarregar
          </Button>
        </div>
      ) : (
        <DashboardKpis stats={stats} />
      )}

      {/* Recomendações da IA: carrega e falha de forma independente das estatísticas */}
      <AiRecommendationsCard />

      {stats && !loading && (
        <DashboardDetails stats={stats} getStatusBadge={getStatusBadge} />
      )}
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

function DashboardKpis({ stats }: { stats: IDashboardStats }) {
  const chart = stats.salesChartData ?? [];
  const kpis = [
    {
      title: "Faturamento geral",
      value: stats.totalSalesRevenue,
      trend: chart.map((p) => p.totalSales),
      note: `${stats.totalSalesCount} vendas finalizadas`,
    },
    {
      title: "Minhas vendas",
      value: stats.mySalesRevenue,
      trend: chart.map((p) => p.mySales),
      note: `${stats.mySalesCount} vendas suas`,
    },
    {
      title: "Ticket médio geral",
      value: stats.avgSaleValue,
      note: "Valor médio por venda",
    },
    {
      title: "Meu ticket médio",
      value: stats.myAvgSaleValue,
      note: "Valor médio das suas vendas",
    },
  ];

  return (
    <Stagger className="grid grid-cols-1 gap-y-10 border-y border-border/70 py-9 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border/70">
      {kpis.map(({ title, value, trend, note }) => (
        <StaggerItem key={title} className="xl:px-8 xl:first:pl-0 xl:last:pr-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 tabular-nums text-[2.4rem] font-light leading-none tracking-tight">
            <CountUp value={value} format={formatCurrency} />
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{note}</p>
          {trend && <Sparkline values={trend} />}
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function DashboardDetails({
  stats,
  getStatusBadge,
}: {
  stats: IDashboardStats;
  getStatusBadge: (status: string) => ReactNode;
}) {
  return (
    <>
      {/* Seção Gráfica Central */}
      <section className="pt-2">
        <div className="mb-6 flex flex-col gap-1">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Histórico de Faturamento Diário
            </h2>
            <p className="text-sm text-muted-foreground">
              Comparativo do faturamento geral em relação às suas vendas nos
              últimos 7 dias.
            </p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.salesChartData}>
              <defs>
                <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="myColor" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs text-muted-foreground"
                tickFormatter={(value: number) => `R$ ${value}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), ""]}
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
                name="Faturamento Geral"
                type="monotone"
                dataKey="totalSales"
                stroke="var(--color-primary, #2563eb)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#totalColor)"
              />
              <Area
                name="Minhas Vendas"
                type="monotone"
                dataKey="mySales"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#myColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Rodapé: Alertas de Estoque e Compras Recentes */}
      <div className="grid gap-10 border-t border-border/70 pt-8 md:grid-cols-2 md:gap-0 md:divide-x md:divide-border/70">
        {/* Lado Esquerdo: Alertas de Estoque */}
        <section className="flex flex-col md:pr-8">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Alertas de Estoque Baixo
                </h2>
                <p className="text-sm text-muted-foreground">
                  Produtos com saldo abaixo do estoque mínimo cadastrado (ou de
                  15 unidades, quando não definido).
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {stats.stockAlerts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm">
                  Parabéns! Todo o seu estoque está acima da margem crítica.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {stats.stockAlerts.map((item) => {
                  const threshold =
                    item.minStock && item.minStock > 0
                      ? item.minStock
                      : DEFAULT_STOCK_THRESHOLD;
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">
                          {item.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Cód: {item.productCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm font-bold ${item.currentStock <= 5 ? "text-rose-500" : "text-amber-500"}`}
                          >
                            {item.currentStock}{" "}
                            {item.unitType === "Unit"
                              ? "un"
                              : item.unitType.toLowerCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            saldo atual · mín. {threshold}
                          </span>
                        </div>
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.currentStock <= 5 ? "bg-rose-500" : "bg-amber-500"}`}
                            style={{
                              width: `${Math.min((item.currentStock / threshold) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Lado Direito: Histórico de Compras */}
        <section className="flex flex-col md:pl-8">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Histórico Recente de Compras
                </h2>
                <p className="text-sm text-muted-foreground">
                  Os 5 últimos pedidos de compras registrados no sistema.
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {stats.recentPurchases.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2" />
                <p className="text-sm">
                  Nenhum pedido de compra foi encontrado.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {stats.recentPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">
                        {purchase.supplierName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateOnly(purchase.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">
                        {formatCurrency(purchase.totalAmount)}
                      </span>
                      {getStatusBadge(purchase.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export function Home() {
  return (
    <DashboardProvider>
      <DashboardHome />
    </DashboardProvider>
  );
}
