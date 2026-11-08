import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Home } from "@/pages/Home";
import { apiUrl, server } from "@/test/server";
import {
  expiringLots,
  forecastTop,
  lowStock,
  salesChart,
  salesKpis,
  upcomingEvents,
} from "@/test/fixtures/dashboard.fixtures";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

const currentStore = vi.hoisted(() => ({ storeId: null as string | null }));
vi.mock("@/hooks/use-current-store", () => ({
  useCurrentStore: () => currentStore,
}));

const requested: string[] = [];
const requestedUrls: URL[] = [];

function dashboardHandlers() {
  return [
    http.get(apiUrl("dashboard/sales-kpis"), () =>
      HttpResponse.json(salesKpis)
    ),
    http.get(apiUrl("dashboard/sales-chart"), () =>
      HttpResponse.json(salesChart)
    ),
    http.get(apiUrl("dashboard/low-stock"), () => HttpResponse.json(lowStock)),
    http.get(apiUrl("dashboard/expiring-lots"), () =>
      HttpResponse.json(expiringLots)
    ),
    http.get(apiUrl("dashboard/upcoming-events"), () =>
      HttpResponse.json(upcomingEvents)
    ),
    http.get(apiUrl("forecasts/latest/top"), () =>
      HttpResponse.json(forecastTop)
    ),
  ];
}

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

beforeEach(() => {
  requested.length = 0;
  requestedUrls.length = 0;
  currentStore.storeId = null;
  server.events.on("request:start", ({ request }) => {
    requested.push(new URL(request.url).pathname);
    requestedUrls.push(new URL(request.url));
  });
  return () => server.events.removeAllListeners();
});

describe("Painel inicial (F3.8b, T-DF1)", () => {
  it("carrega todos os blocos pelas rotas novas, sem chamar /api/dashboard/stats", async () => {
    server.use(...dashboardHandlers());
    renderHome();

    const kpis = await screen.findByRole("region", { name: "Vendas do mês" });
    expect(await within(kpis).findByText("R$ 48.250,50")).toBeInTheDocument();
    expect(within(kpis).getByText("312")).toBeInTheDocument();

    const stock = screen.getByRole("region", { name: "Estoque baixo" });
    expect(
      await within(stock).findByText("Trufa de Maracujá")
    ).toBeInTheDocument();

    const lots = screen.getByRole("region", { name: "Lotes vencendo" });
    expect(await within(lots).findByText(/L-2611-07/)).toBeInTheDocument();

    const events = screen.getByRole("region", { name: "Próximas datas" });
    expect(await within(events).findByText("Natal")).toBeInTheDocument();

    const recs = screen.getByRole("region", { name: "Recomendações da IA" });
    expect(
      await within(recs).findByText("Panetone Trufado")
    ).toBeInTheDocument();
    expect(
      within(recs).getByText(/6 de compra · 2 de promoção/)
    ).toBeInTheDocument();

    expect(requested).not.toContain("/api/dashboard/stats");
    expect(requested).toEqual(
      expect.arrayContaining([
        "/api/dashboard/sales-kpis",
        "/api/dashboard/sales-chart",
        "/api/dashboard/low-stock",
        "/api/dashboard/expiring-lots",
        "/api/dashboard/upcoming-events",
        "/api/forecasts/latest/top",
      ])
    );
  });

  it("vendas, estoque baixo e lotes seguem a loja selecionada no topo", async () => {
    currentStore.storeId = "store-2";
    server.use(...dashboardHandlers());
    renderHome();

    await screen.findByRole("region", { name: "Vendas do mês" });
    const stock = screen.getByRole("region", { name: "Estoque baixo" });
    await within(stock).findByText("Trufa de Maracujá");

    const storeOf = (path: string) =>
      requestedUrls
        .find((url) => url.pathname === `/api/dashboard/${path}`)
        ?.searchParams.get("storeId");
    expect(storeOf("sales-kpis")).toBe("store-2");
    expect(storeOf("sales-chart")).toBe("store-2");
    expect(storeOf("low-stock")).toBe("store-2");
    expect(storeOf("expiring-lots")).toBe("store-2");
  });

  it("em todas as lojas o painel não manda loja", async () => {
    server.use(...dashboardHandlers());
    renderHome();

    const stock = await screen.findByRole("region", { name: "Estoque baixo" });
    await within(stock).findByText("Trufa de Maracujá");

    const lowStockUrl = requestedUrls.find(
      (url) => url.pathname === "/api/dashboard/low-stock"
    );
    expect(lowStockUrl?.searchParams.has("storeId")).toBe(false);
  });

  it("um bloco que falha mostra o erro só nele e os outros carregam", async () => {
    server.use(...dashboardHandlers());
    server.use(
      http.get(apiUrl("dashboard/low-stock"), () =>
        HttpResponse.json(
          { message: "Falha ao ler o estoque." },
          { status: 500 }
        )
      )
    );
    renderHome();

    const stock = await screen.findByRole("region", { name: "Estoque baixo" });
    expect(
      await within(stock).findByText("Falha ao ler o estoque.")
    ).toBeInTheDocument();
    expect(
      within(stock).getByRole("button", { name: /tentar novamente/i })
    ).toBeInTheDocument();

    const events = screen.getByRole("region", { name: "Próximas datas" });
    expect(await within(events).findByText("Natal")).toBeInTheDocument();
  });

  it("sem análise de demanda, o card de recomendações explica e aponta a previsão", async () => {
    server.use(...dashboardHandlers());
    server.use(
      http.get(apiUrl("forecasts/latest/top"), () =>
        HttpResponse.json({ run: null, recommendations: [] })
      )
    );
    renderHome();

    const recs = await screen.findByRole("region", {
      name: "Recomendações da IA",
    });
    expect(
      await within(recs).findByText(
        /Nenhuma análise de demanda foi gerada ainda/
      )
    ).toBeInTheDocument();
  });

  it("listas vazias mostram o estado vazio de cada bloco", async () => {
    server.use(...dashboardHandlers());
    server.use(
      http.get(apiUrl("dashboard/low-stock"), () =>
        HttpResponse.json({ count: 0, items: [] })
      ),
      http.get(apiUrl("dashboard/expiring-lots"), () =>
        HttpResponse.json({ count: 0, totalCostValue: 0, items: [] })
      ),
      http.get(apiUrl("dashboard/upcoming-events"), () => HttpResponse.json([]))
    );
    renderHome();

    const stock = await screen.findByRole("region", { name: "Estoque baixo" });
    expect(
      await within(stock).findByText("Nenhuma variação abaixo do mínimo.")
    ).toBeInTheDocument();
    const lots = screen.getByRole("region", { name: "Lotes vencendo" });
    expect(
      await within(lots).findByText("Nenhum lote vence nos próximos 30 dias.")
    ).toBeInTheDocument();
    const events = screen.getByRole("region", { name: "Próximas datas" });
    expect(
      await within(events).findByText(
        "Nenhuma data comemorativa nos próximos 90 dias."
      )
    ).toBeInTheDocument();
  });
});
