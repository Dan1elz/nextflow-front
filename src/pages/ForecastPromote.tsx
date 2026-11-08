import { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { BulkPromoteForm } from "@/components/app/bulk-promote-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { IForecastRecommendationListItem } from "@/interfaces/forecast.interface";
import { forecastRunService } from "@/services/forecast-run.service";
import { TRecommendationAction, TRecommendationStatus } from "@/types/enums";
import { isAdmin } from "@/utils/auth.helpers";

type PromoteState = { recommendations?: IForecastRecommendationListItem[] };

const promotable = (rec: IForecastRecommendationListItem) =>
  rec.action === TRecommendationAction.Promote &&
  rec.status === TRecommendationStatus.Pending;

/**
 * Promover selecionados em tela própria (`/forecast/promote?ids=…`). A lista vem no `state` da navegação a partir da
 * `/forecast`; sem ele (recarregou a página, link copiado) busca cada recomendação pelos `ids` da URL.
 */
export default function ForecastPromotePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const fromState = (location.state as PromoteState | null)?.recommendations;

  const [recommendations, setRecommendations] = useState<
    IForecastRecommendationListItem[] | null
  >(fromState ? fromState.filter(promotable) : null);
  const [error, setError] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (fromState) return;
    let cancelled = false;
    Promise.all(
      idsKey
        .split(",")
        .filter(Boolean)
        .map((id) =>
          forecastRunService.getRecommendation(id, token ?? undefined)
        )
    )
      .then((loaded) => {
        if (!cancelled) setRecommendations(loaded.filter(promotable));
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error && reason.message
              ? reason.message
              : "Erro ao carregar as recomendações"
          );
      });
    return () => {
      cancelled = true;
    };
  }, [fromState, idsKey, token]);

  if (!isAdmin(user)) return <Navigate to="/forecast" replace />;

  const back = () => navigate("/forecast");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Promover selecionados</CardTitle>
              <CardDescription>
                Cada produto ganha uma promoção a partir de hoje, com o desconto
                e a duração sugeridos pela análise. Ajuste o que precisar.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={back}>
              <ArrowLeft data-icon="inline-start" />
              Previsão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : recommendations === null ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : recommendations.length === 0 ? (
            <Alert>
              <AlertTriangle />
              <AlertTitle>Nada para promover</AlertTitle>
              <AlertDescription>
                As recomendações escolhidas não estão mais pendentes. Volte à
                previsão e selecione de novo.
              </AlertDescription>
            </Alert>
          ) : (
            <BulkPromoteForm
              key={recommendations.map((rec) => rec.id).join()}
              recommendations={recommendations}
              onClose={back}
              onDone={back}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
