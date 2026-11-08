import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { forecastRunService } from "@/services/forecast-run.service";
import { apiUrl, server } from "@/test/server";
import {
  progress,
  recommendationsRun1,
  runCompleted,
  runRunning,
} from "@/test/fixtures/forecast.fixtures";

describe("forecastRunService (T-DF2)", () => {
  it("lê a última análise e devolve null quando nunca houve", async () => {
    server.use(
      http.get(apiUrl("forecasts/latest"), () =>
        HttpResponse.json(runCompleted)
      )
    );
    await expect(forecastRunService.getLatest()).resolves.toEqual(runCompleted);

    server.use(
      http.get(apiUrl("forecasts/latest"), () => HttpResponse.json(null))
    );
    await expect(forecastRunService.getLatest()).resolves.toBeNull();
  });

  it("gera a análise sem horizonte (é automático)", async () => {
    let body: unknown = "não chamou";
    server.use(
      http.post(apiUrl("forecasts/generate"), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(runRunning, { status: 201 });
      })
    );

    await expect(forecastRunService.generate()).resolves.toEqual(runRunning);
    expect(body).toEqual({});
  });

  it("consulta o progresso da análise", async () => {
    server.use(
      http.get(apiUrl("forecasts/:runId/status"), ({ params }) =>
        HttpResponse.json({ ...progress(3, 8), id: String(params.runId) })
      )
    );

    await expect(forecastRunService.getStatus("run-2")).resolves.toMatchObject({
      id: "run-2",
      batches: { completed: 3, total: 8 },
    });
  });

  it("lista as recomendações da análise com paginação e filtros", async () => {
    let query: URLSearchParams | null = null;
    let path = "";
    server.use(
      http.get(apiUrl("forecasts/:runId/recommendations"), ({ request }) => {
        const url = new URL(request.url);
        path = url.pathname;
        query = url.searchParams;
        return HttpResponse.json(recommendationsRun1);
      })
    );

    await expect(
      forecastRunService.getRecommendations("run-1", {
        page: 2,
        perPage: 20,
        filters: { action: "Buy", status: "Pending" },
      })
    ).resolves.toEqual(recommendationsRun1);

    expect(path).toBe("/api/forecasts/run-1/recommendations");
    const params = query as unknown as URLSearchParams;
    expect(params.get("offset")).toBe("20");
    expect(params.get("limit")).toBe("20");
    expect(JSON.parse(params.get("filters") ?? "{}")).toEqual({
      action: "Buy",
      status: "Pending",
    });
  });
});
