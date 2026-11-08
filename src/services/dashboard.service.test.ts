import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { dashboardService } from "@/services/dashboard.service";
import { apiUrl, server } from "@/test/server";
import {
  expiringLots,
  forecastTop,
  lowStock,
  salesChart,
  salesKpis,
  upcomingEvents,
} from "@/test/fixtures/dashboard.fixtures";

describe("dashboardService (T-DF1)", () => {
  it("busca cada bloco do painel na sua rota", async () => {
    server.use(
      http.get(apiUrl("dashboard/sales-kpis"), () =>
        HttpResponse.json(salesKpis)
      ),
      http.get(apiUrl("dashboard/sales-chart"), () =>
        HttpResponse.json(salesChart)
      ),
      http.get(apiUrl("dashboard/low-stock"), () =>
        HttpResponse.json(lowStock)
      ),
      http.get(apiUrl("dashboard/upcoming-events"), () =>
        HttpResponse.json(upcomingEvents)
      )
    );

    await expect(dashboardService.getSalesKpis()).resolves.toEqual(salesKpis);
    await expect(dashboardService.getSalesChart()).resolves.toEqual(salesChart);
    await expect(dashboardService.getLowStock()).resolves.toEqual(lowStock);
    await expect(dashboardService.getUpcomingEvents()).resolves.toEqual(
      upcomingEvents
    );
  });

  it("pede os lotes vencendo nos próximos 30 dias", async () => {
    let days: string | null = null;
    server.use(
      http.get(apiUrl("dashboard/expiring-lots"), ({ request }) => {
        days = new URL(request.url).searchParams.get("days");
        return HttpResponse.json(expiringLots);
      })
    );

    await expect(dashboardService.getExpiringLots()).resolves.toEqual(
      expiringLots
    );
    expect(days).toBe("30");
  });

  it("pega as 5 primeiras recomendações da última análise", async () => {
    let limit: string | null = null;
    server.use(
      http.get(apiUrl("forecasts/latest/top"), ({ request }) => {
        limit = new URL(request.url).searchParams.get("limit");
        return HttpResponse.json(forecastTop);
      })
    );

    await expect(dashboardService.getForecastTop()).resolves.toEqual(
      forecastTop
    );
    expect(limit).toBe("5");
  });
});
