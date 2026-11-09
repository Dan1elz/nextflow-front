import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  PackageMinus,
  ShoppingCart,
  Sparkles,
  TicketPercent,
} from "lucide-react";

import { ApplyPromotionDialog } from "@/components/app/apply-promotion-dialog";
import { ApplyPurchaseDialog } from "@/components/app/apply-purchase-dialog";
import { PromotionCreateDialog } from "@/components/app/promotion-create-dialog";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import type {
  IExpiringLotItem,
  IExpiringLotsSummary,
  ILowStockItem,
  ILowStockSummary,
} from "@/interfaces/dashboard.interface";
import type {
  IForecastRecommendationListItem,
  IPromotionSuggestion,
} from "@/interfaces/forecast.interface";
import type { PurchaseSuggestionState } from "@/interfaces/purchase-order.interface";
import { PromotionsProvider } from "@/providers/promotions.provider";
import {
  dashboardService,
  DASHBOARD_MORE_LIMIT,
  EXPIRING_LOTS_DAYS,
} from "@/services/dashboard.service";
import { forecastRunService } from "@/services/forecast-run.service";
import { TRecommendationAction } from "@/types/enums";
import { formatDateOnly, formatNumber } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

/** Passo da aba Lotes no detalhe do produto (Variações, Estoque, Lotes): só existe em produto com lote. */
const LOTS_STEP = 3;

const qty = (value: number) =>
  formatNumber(value, Number.isInteger(value) ? 0 : 3);

function Row({
  title,
  subtitle,
  aside,
  actions,
}: {
  title: string;
  subtitle: string;
  aside: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">{aside}</div>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

/** Abre a recomendação da IA no dialog certo (Comprar ou Promover), lendo o detalhe pela API. */
function useRecommendationActions(onDone: () => void) {
  const { token } = useAuth();
  const [buying, setBuying] = useState<IForecastRecommendationListItem[]>([]);
  const [promoting, setPromoting] =
    useState<IForecastRecommendationListItem | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  /** `storeId`: loja da linha, que já virou a loja do topo (o comprar usa o local de recebimento dela). */
  const open = async (recommendationId: string, storeId: string) => {
    setLoadingId(recommendationId);
    try {
      const rec = await forecastRunService.getRecommendation(
        recommendationId,
        token ?? undefined,
        storeId
      );
      if (rec.action === TRecommendationAction.Buy) setBuying([rec]);
      else if (rec.action === TRecommendationAction.Promote) setPromoting(rec);
    } catch (error) {
      handleError(error, "Erro ao abrir a recomendação");
    } finally {
      setLoadingId(null);
    }
  };

  const dialogs = (
    <>
      <ApplyPurchaseDialog
        open={buying.length > 0}
        onOpenChange={(value) => !value && setBuying([])}
        recommendations={buying}
        onApplied={onDone}
      />
      <ApplyPromotionDialog
        recommendation={promoting}
        onOpenChange={(value) => !value && setPromoting(null)}
        onDone={onDone}
      />
    </>
  );

  return { open, loadingId, dialogs };
}

function useMore<T>(
  load: (token: string | undefined, storeId: string | null) => Promise<T>
) {
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const [data, setData] = useState<T | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    load(token ?? undefined, storeId)
      .then((result) => !ignore && setData(result))
      .catch((error) => handleError(error, "Erro ao carregar a lista"));
    return () => {
      ignore = true;
    };
    // `load` é estável por quem chama (função de módulo); `version` recarrega depois de uma ação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, storeId, version]);

  return { data, storeId, reload: () => setVersion((value) => value + 1) };
}

const loadLowStock = (token: string | undefined, storeId: string | null) =>
  dashboardService.getLowStock(token, storeId, DASHBOARD_MORE_LIMIT);
const loadExpiringLots = (token: string | undefined, storeId: string | null) =>
  dashboardService.getExpiringLots(token, storeId, DASHBOARD_MORE_LIMIT);

function MorePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft data-icon="inline-start" />
              Painel
            </Button>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function EmptyList({ text }: { text: string }) {
  return (
    <Alert>
      <AlertTriangle />
      <AlertTitle>{text}</AlertTitle>
    </Alert>
  );
}

/** Local da linha; em "todas as lojas" leva o nome da loja junto. */
const placeOf = (
  item: { storeName: string; locationName: string },
  storeId: string | null
) => (storeId ? item.locationName : `${item.storeName} › ${item.locationName}`);

/**
 * "Ver mais" do estoque baixo (`/dashboard/low-stock`): toda linha tem "Comprar com a IA". Com recomendação "Comprar" pendente da
 * análise, abre o comprar dela; senão pede à IA na hora quanto comprar da variação no local (RN-DF30) e abre o pedido de compra
 * já com o item e a quantidade. "Novo pedido de compra" abre o mesmo pedido com a quantidade só calculada (sem gastar cota).
 * Cada ação troca a loja do topo para a loja da linha antes de abrir.
 */
export function LowStockMore() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { setStoreId } = useCurrentStore();
  const { data, storeId, reload } = useMore<ILowStockSummary>(loadLowStock);
  const actions = useRecommendationActions(reload);
  const [asking, setAsking] = useState<string | null>(null);

  const purchase = async (item: ILowStockItem, ai: boolean) => {
    const key = `${item.variantId}-${item.locationId}`;
    setAsking(key);
    try {
      const suggestion = await forecastRunService.getPurchaseSuggestion(
        item.variantId,
        item.locationId,
        ai,
        token ?? undefined
      );
      const params = new URLSearchParams({
        productId: item.productId,
        variantId: item.variantId,
        quantity: String(suggestion.quantity),
      });
      setStoreId(item.storeId);
      navigate(`/purchase-orders/create?${params}`, {
        state: { suggestion } satisfies PurchaseSuggestionState,
      });
    } catch (error) {
      handleError(error, "Erro ao buscar a sugestão de compra");
    } finally {
      setAsking(null);
    }
  };

  return (
    <MorePage
      title="Estoque baixo"
      description={
        data
          ? `${data.count} ${data.count === 1 ? "variação abaixo" : "variações abaixo"} do mínimo do local.`
          : "Variações com saldo abaixo do mínimo do local."
      }
    >
      {!data ? (
        <Skeleton className="h-40 w-full" />
      ) : data.items.length === 0 ? (
        <EmptyList text="Nenhuma variação abaixo do mínimo." />
      ) : (
        <div className="divide-y rounded-xl border">
          {data.items.map((item: ILowStockItem) => {
            const key = `${item.variantId}-${item.locationId}`;
            const busy = asking != null || actions.loadingId != null;
            const fromAnalysis =
              item.recommendationId &&
              item.recommendationAction === TRecommendationAction.Buy;
            return (
              <Row
                key={key}
                title={item.productName}
                subtitle={`${item.variantLabel ? `${item.variantLabel} · ` : ""}${placeOf(item, storeId)}`}
                aside={
                  <>
                    <span
                      className={`text-sm font-semibold tabular-nums ${item.available <= 0 ? "text-destructive" : ""}`}
                    >
                      {qty(item.available)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      mín. {qty(item.minQuantity)}
                    </span>
                  </>
                }
                actions={
                  <>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (fromAnalysis) {
                          setStoreId(item.storeId);
                          void actions.open(
                            item.recommendationId!,
                            item.storeId
                          );
                        } else void purchase(item, true);
                      }}
                    >
                      {asking === key ? <Spinner /> : <Sparkles />}
                      Comprar com a IA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void purchase(item, false)}
                    >
                      <ShoppingCart />
                      Novo pedido de compra
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}
      {actions.dialogs}
    </MorePage>
  );
}

/**
 * "Ver mais" dos lotes vencendo (`/dashboard/expiring-lots`): promover pela IA, promover direto ou dar baixa no lote (na aba
 * Lotes do produto). Cada ação troca a loja do topo para a loja do lote antes de abrir.
 */
export function ExpiringLotsMore() {
  const navigate = useNavigate();
  const { setStoreId } = useCurrentStore();
  const { data, storeId, reload } =
    useMore<IExpiringLotsSummary>(loadExpiringLots);
  const actions = useRecommendationActions(reload);
  const { token } = useAuth();
  const [promotingProduct, setPromotingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [suggestion, setSuggestion] = useState<IPromotionSuggestion | null>(
    null
  );
  const [asking, setAsking] = useState<string | null>(null);

  /** Pede à IA o desconto e os dias para escoar o lote (RN-DF30) e abre a promoção já preenchida. */
  const promoteWithAi = async (item: IExpiringLotItem) => {
    const key = `${item.lotId}-${item.locationId}`;
    setAsking(key);
    try {
      const found = await forecastRunService.getPromotionSuggestion(
        item.lotId,
        item.locationId,
        token ?? undefined
      );
      setStoreId(item.storeId);
      setSuggestion(found);
      setPromotingProduct({ id: item.productId, name: item.productName });
    } catch (error) {
      handleError(error, "Erro ao buscar a sugestão de promoção");
    } finally {
      setAsking(null);
    }
  };

  return (
    <MorePage
      title="Lotes vencendo"
      description={
        data
          ? `${data.count} ${data.count === 1 ? "lote vence" : "lotes vencem"} nos próximos ${EXPIRING_LOTS_DAYS} dias.`
          : `Lotes que vencem nos próximos ${EXPIRING_LOTS_DAYS} dias.`
      }
    >
      {!data ? (
        <Skeleton className="h-40 w-full" />
      ) : data.items.length === 0 ? (
        <EmptyList
          text={`Nenhum lote vence nos próximos ${EXPIRING_LOTS_DAYS} dias.`}
        />
      ) : (
        <div className="divide-y rounded-xl border">
          {data.items.map((item: IExpiringLotItem) => (
            <Row
              key={`${item.lotId}-${item.locationId}`}
              title={`${item.productName}${item.variantLabel ? ` · ${item.variantLabel}` : ""}`}
              subtitle={`Lote ${item.lotCode} · ${placeOf(item, storeId)} · Qtd. ${qty(item.quantity)}`}
              aside={
                <>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatDateOnly(item.expiresOn)}
                  </span>
                  <span
                    className={`text-xs ${item.daysToExpire <= 7 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {item.daysToExpire === 0
                      ? "vence hoje"
                      : `em ${item.daysToExpire} ${item.daysToExpire === 1 ? "dia" : "dias"}`}
                  </span>
                </>
              }
              actions={
                <>
                  <Button
                    size="sm"
                    disabled={asking != null || actions.loadingId != null}
                    onClick={() => {
                      // Recomendação "Promover" da análise: aplica ela (fica ligada à promoção); senão, a IA na hora.
                      if (
                        item.recommendationId &&
                        item.recommendationAction ===
                          TRecommendationAction.Promote
                      ) {
                        setStoreId(item.storeId);
                        void actions.open(item.recommendationId, item.storeId);
                      } else void promoteWithAi(item);
                    }}
                  >
                    {asking === `${item.lotId}-${item.locationId}` ? (
                      <Spinner />
                    ) : (
                      <Sparkles />
                    )}
                    Promover com a IA
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStoreId(item.storeId);
                      setSuggestion(null);
                      setPromotingProduct({
                        id: item.productId,
                        name: item.productName,
                      });
                    }}
                  >
                    <TicketPercent />
                    Promover
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStoreId(item.storeId);
                      navigate(
                        `/products/${item.productId}/view?step=${LOTS_STEP}`
                      );
                    }}
                  >
                    <PackageMinus />
                    Dar baixa
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}
      {actions.dialogs}
      <PromotionsProvider>
        <PromotionCreateDialog
          open={promotingProduct != null}
          onOpenChange={(value) => {
            if (value) return;
            setPromotingProduct(null);
            setSuggestion(null);
          }}
          fixedProduct={promotingProduct}
          suggestion={
            suggestion && {
              variantId: suggestion.variantId,
              discountPercent: suggestion.discountPercent,
              days: suggestion.promotionDays,
              reason: `Lote vencendo em ${formatDateOnly(suggestion.expiresOn)}${suggestion.fromAi ? " (sugestão da IA)" : ""}`,
              explanation: suggestion.reason,
              fromAi: suggestion.fromAi,
            }
          }
          onCreated={reload}
        />
      </PromotionsProvider>
    </MorePage>
  );
}
