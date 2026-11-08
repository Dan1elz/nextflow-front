import { AlertTriangle, RefreshCw } from "lucide-react";

import { ForecastDetailView } from "@/components/app/forecast-detail";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProductForecast,
  useRecommendationDetail,
} from "@/hooks/use-forecast-detail";

function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{message}</AlertTitle>
      <AlertDescription>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Aba "Previsão" do produto (T-DF5): previsão do produto e, se houver, a recomendação mais recente
 * com a mesma visão do drawer da `/forecast` (T-DF3).
 */
export function ProductForecastTab({ productId }: { productId: string }) {
  const forecast = useProductForecast(productId);
  const recommendationId = forecast.data?.latestRecommendationId ?? null;
  const detail = useRecommendationDetail(recommendationId);

  if (forecast.error)
    return <LoadError message={forecast.error} onRetry={forecast.reload} />;
  if (forecast.loading || !forecast.data) return <Loading />;
  if (detail.error)
    return <LoadError message={detail.error} onRetry={detail.reload} />;
  if (detail.loading) return <Loading />;

  return <ForecastDetailView product={forecast.data} detail={detail.data} />;
}
