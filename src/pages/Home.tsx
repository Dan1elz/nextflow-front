import { useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
        <CardTitle className="text-lg mb-2">Sem dados</CardTitle>
        <CardDescription className="mb-4">Não foi possível carregar as informações do painel.</CardDescription>
        <Button onClick={() => void fetchStats()} size="sm">Recarregar</Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Cabeçalho de Boas-vindas */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {user?.name || "Usuário"}</h1>
          <p className="text-sm text-muted-foreground">Aqui está um resumo em tempo real do sistema Nextflow.</p>
        </div>
        <Button onClick={() => void fetchStats()} size="sm" variant="outline">
          Atualizar Dados
        </Button>
      </div>

      {/* Grid de KPIs Consolidados */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Faturamento Geral */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary bg-card/65 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faturamento Geral</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{formatCurrency(stats.totalSalesRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reflete <span className="font-semibold text-foreground">{stats.totalSalesCount}</span> vendas finalizadas.
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Meu Faturamento */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500 bg-card/65 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minhas Vendas</CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.mySalesRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Seu faturamento em <span className="font-semibold text-foreground">{stats.mySalesCount}</span> vendas.
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Ticket Médio Geral */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-sky-500 bg-card/65 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket Médio Geral</CardTitle>
            <div className="rounded-full bg-sky-500/10 p-2 text-sky-500 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{formatCurrency(stats.avgSaleValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor médio por venda geral.</p>
          </CardContent>
        </Card>

        {/* KPI 4: Meu Ticket Médio */}
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500 bg-card/65 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meu Ticket Médio</CardTitle>
            <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl text-indigo-600 dark:text-indigo-400">{formatCurrency(stats.myAvgSaleValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor médio das suas vendas.</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Gráfica Central */}
      <Card className="bg-card/65 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Histórico de Faturamento Diário</CardTitle>
            <CardDescription>Comparativo do faturamento geral em relação às suas vendas nos últimos 7 dias.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.salesChartData}>
              <defs>
                <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #2563eb)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-primary, #2563eb)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="myColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="dateLabel" className="text-xs text-muted-foreground" />
              <YAxis
                className="text-xs text-muted-foreground"
                tickFormatter={(value: number) => `R$ ${value}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), ""]}
                contentStyle={{
                  backgroundColor: "rgba(var(--background), 0.8)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                name="Faturamento Geral"
                type="monotone"
                dataKey="totalSales"
                stroke="var(--color-primary, #2563eb)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#totalColor)"
              />
              <Area
                name="Minhas Vendas"
                type="monotone"
                dataKey="mySales"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#myColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rodapé: Alertas de Estoque e Compras Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lado Esquerdo: Alertas de Estoque */}
        <Card className="bg-card/65 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle>Alertas de Estoque Baixo</CardTitle>
                <CardDescription>Produtos cadastrados que estão com o saldo abaixo de 15 unidades.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.stockAlerts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm">Parabéns! Todo o seu estoque está acima da margem crítica.</p>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {stats.stockAlerts.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{item.productName}</span>
                      <span className="text-xs text-muted-foreground">Cód: {item.productCode}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${item.currentStock <= 5 ? "text-rose-500" : "text-amber-500"}`}>
                          {item.currentStock} {item.unitType === "Unit" ? "un" : item.unitType.toLowerCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">saldo atual</span>
                      </div>
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.currentStock <= 5 ? "bg-rose-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min((item.currentStock / 15) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lado Direito: Histórico de Compras */}
        <Card className="bg-card/65 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle>Histórico Recente de Compras</CardTitle>
                <CardDescription>Os 5 últimos pedidos de compras registrados no sistema.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.recentPurchases.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhum pedido de compra foi encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {stats.recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{purchase.supplierName}</span>
                      <span className="text-xs text-muted-foreground">{formatDateOnly(purchase.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{formatCurrency(purchase.totalAmount)}</span>
                      {getStatusBadge(purchase.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Home() {
  return (
    <DashboardProvider>
      <DashboardHome />
    </DashboardProvider>
  );
}
