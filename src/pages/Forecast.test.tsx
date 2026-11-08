import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForecastContent } from "@/pages/Forecast";
import type { IForecastRunSummary } from "@/interfaces/forecast.interface";
import { ForecastRunProvider } from "@/providers/forecast-run.provider";
import { apiUrl, server } from "@/test/server";
import {
  progress,
  recommendationDetail,
  recommendationsRun1,
  recommendationsRun2,
  runCompleted,
  runFinished,
  runRunning,
} from "@/test/fixtures/forecast.fixtures";

const auth = vi.hoisted(() => ({ role: "Admin" }));

vi.mock("@/hooks/use-current-store", () => ({
  useCurrentStore: () => ({ storeId: "store-1" }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    token: "token",
    user: { name: "Daniel", role: auth.role },
  }),
}));

/** Estado do "servidor" de cada teste. */
let latest: IForecastRunSummary | null;
let recommendationQueries: { runId: string; filters: Record<string, string> }[];
let applied: boolean;

function baseHandlers() {
  return [
    http.get(apiUrl("forecasts/latest"), () => HttpResponse.json(latest)),
    http.get(
      apiUrl("forecasts/:runId/recommendations"),
      ({ params, request }) => {
        const runId = String(params.runId);
        const raw = new URL(request.url).searchParams.get("filters");
        recommendationQueries.push({
          runId,
          filters: raw ? JSON.parse(raw) : {},
        });
        if (applied)
          return HttpResponse.json({
            ...recommendationsRun1,
            items: [{ ...recommendationsRun1.items[0], status: "Applied" }],
          });
        return HttpResponse.json(
          runId === "run-2" ? recommendationsRun2 : recommendationsRun1
        );
      }
    ),
  ];
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ForecastRunProvider pollIntervalMs={20}>
        <ForecastContent />
      </ForecastRunProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  auth.role = "Admin";
  latest = runCompleted;
  recommendationQueries = [];
  applied = false;
});

describe("Previsão: lista da análise (F3.8d, T-DF2)", () => {
  it("mostra o cabeçalho da última análise e as recomendações pendentes", async () => {
    server.use(...baseHandlers());
    renderPage();

    const header = await screen.findByRole("region", {
      name: "Última análise",
    });
    expect(within(header).getByText("Concluída")).toBeInTheDocument();
    expect(within(header).getByText(/nov\/26 a abr\/27/)).toBeInTheDocument();
    expect(within(header).getByText("48")).toBeInTheDocument();
    expect(
      within(header).getByText(/O Natal puxa as trufas/)
    ).toBeInTheDocument();

    expect(
      (await screen.findAllByText("Trufa de Maracujá")).length
    ).toBeGreaterThan(0);
    expect(recommendationQueries[0]).toEqual({
      runId: "run-1",
      filters: { status: "Pending" },
    });
  });

  it("filtra por ação e busca por produto", async () => {
    server.use(...baseHandlers());
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Trufa de Maracujá");

    await user.click(screen.getByRole("tab", { name: /Comprar/ }));
    await waitFor(() =>
      expect(recommendationQueries.at(-1)?.filters).toEqual({
        status: "Pending",
        action: "Buy",
      })
    );

    await user.type(screen.getByLabelText("Pesquisar produto"), "trufa");
    await waitFor(
      () =>
        expect(recommendationQueries.at(-1)?.filters).toEqual({
          status: "Pending",
          action: "Buy",
          search: "trufa",
        }),
      { timeout: 2000 }
    );
  });

  it("abre o detalhe da recomendação pelo nome do produto (T-DF3)", async () => {
    server.use(
      ...baseHandlers(),
      http.get(apiUrl("forecasts/recommendations/:id"), () =>
        HttpResponse.json(recommendationDetail)
      )
    );
    const user = userEvent.setup();
    renderPage();

    const [open] = await screen.findAllByRole("button", {
      name: /Trufa de Maracujá/,
    });
    await user.click(open);

    const sheet = await screen.findByRole("dialog", {
      name: "Trufa de Maracujá",
    });
    expect(
      await within(sheet).findByRole("table", { name: "Rateio por variação" })
    ).toBeInTheDocument();
  });

  it("a linha não tem botões de ação; as abas mostram o contador", async () => {
    server.use(...baseHandlers());
    renderPage();
    await screen.findAllByText("Trufa de Maracujá");

    expect(
      screen.queryByRole("button", { name: /^(Comprar|Promover|Descartar) / })
    ).not.toBeInTheDocument();
    const tab = screen.getByRole("tab", { name: /Comprar/ });
    expect(tab.querySelector('[data-slot="tab-count"]')?.textContent).toMatch(
      /^\d+$/
    );
  });

  it("Descartar pelo detalhe e Voltar reabre o detalhe (T-DF8)", async () => {
    server.use(
      ...baseHandlers(),
      http.get(apiUrl("forecasts/recommendations/:id"), () =>
        HttpResponse.json(recommendationDetail)
      )
    );
    const user = userEvent.setup();
    renderPage();

    const [open] = await screen.findAllByRole("button", {
      name: /Trufa de Maracujá/,
    });
    await user.click(open);
    const sheet = await screen.findByRole("dialog", {
      name: "Trufa de Maracujá",
    });
    await user.click(
      await within(sheet).findByRole("button", { name: "Descartar" })
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Descartar recomendação",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Trufa de Maracujá" })
      ).not.toBeInTheDocument()
    );
    await user.click(within(dialog).getByRole("button", { name: "Voltar" }));

    expect(
      await screen.findByRole("dialog", { name: "Trufa de Maracujá" })
    ).toBeInTheDocument();
  });

  it("Comprar pelo detalhe gera o pedido e a linha vira Aplicada (T-DF4)", async () => {
    server.use(
      ...baseHandlers(),
      http.get(apiUrl("forecasts/recommendations/:id"), () =>
        HttpResponse.json(recommendationDetail)
      ),
      http.get(apiUrl("stock-locations/options"), () =>
        HttpResponse.json([
          {
            id: "loc-1",
            name: "Recebimento",
            storeId: "store-1",
            storeName: "Loja Centro",
            isSellable: false,
          },
        ])
      ),
      http.get(apiUrl("stores/:id"), () =>
        HttpResponse.json({ id: "store-1", defaultReceiveLocationId: "loc-1" })
      ),
      http.get(apiUrl("purchase-orders/item-suggestion"), () =>
        HttpResponse.json({ lastCostFromSupplier: 3.5, lastCost: 3 })
      ),
      http.post(apiUrl("forecasts/recommendations/purchase"), () => {
        applied = true;
        return HttpResponse.json({
          purchaseOrders: [
            { id: "po-1", number: 31, supplierName: "Cacau Sul", total: 840 },
          ],
          recommendations: [
            { ...recommendationsRun1.items[0], status: "Applied" },
          ],
        });
      })
    );
    const user = userEvent.setup();
    renderPage();

    const [open] = await screen.findAllByRole("button", {
      name: /Trufa de Maracujá/,
    });
    await user.click(open);
    const sheet = await screen.findByRole("dialog", {
      name: "Trufa de Maracujá",
    });
    await user.click(
      await within(sheet).findByRole("button", { name: "Comprar" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Gerar pedido de compra",
    });
    await within(dialog).findByRole("spinbutton", {
      name: "Quantidade de Trufa de Maracujá (Caixa com 6)",
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("spinbutton", {
          name: "Custo unitário de Trufa de Maracujá (Caixa com 6)",
        })
      ).toHaveValue(3.5)
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Gerar pedido de compra" })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Gerar pedido de compra" })
      ).not.toBeInTheDocument()
    );
    expect((await screen.findAllByText("Aplicada")).length).toBeGreaterThan(0);
  });

  it("análise antiga aberta pelo histórico fica só leitura (T-DF9)", async () => {
    server.use(
      ...baseHandlers(),
      http.get(apiUrl("forecasts/:runId"), () => HttpResponse.json(runFinished))
    );
    render(
      <MemoryRouter>
        <ForecastRunProvider runId="run-2" pollIntervalMs={20}>
          <ForecastContent />
        </ForecastRunProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/só leitura/)).toBeInTheDocument();
    await screen.findAllByText("Panetone Trufado");
    expect(recommendationQueries[0].runId).toBe("run-2");
    expect(
      screen.queryByRole("button", { name: /Gerar/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Descartar/ })
    ).not.toBeInTheDocument();
  });

  it("gerar mostra Em andamento, acompanha os lotes e recarrega ao terminar", async () => {
    let generated = 0;
    let polls = 0;
    server.use(
      ...baseHandlers(),
      http.post(apiUrl("forecasts/generate"), () => {
        generated += 1;
        return HttpResponse.json(runRunning, { status: 201 });
      }),
      http.get(apiUrl("forecasts/:runId/status"), () => {
        polls += 1;
        if (polls < 3) return HttpResponse.json(progress(2, 4));
        latest = runFinished;
        return HttpResponse.json(progress(4, 4, "Completed"));
      })
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Trufa de Maracujá");

    await user.click(
      screen.getByRole("button", { name: "Gerar nova análise" })
    );

    const running = await screen.findByRole("button", {
      name: /Em andamento/,
    });
    expect(running).toBeDisabled();
    expect(await screen.findByText("Lote 2 de 4")).toBeInTheDocument();

    expect(
      (
        await screen.findAllByText("Panetone Trufado", undefined, {
          timeout: 2000,
        })
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Gerar nova análise" })
    ).toBeEnabled();
    expect(generated).toBe(1);
    expect(recommendationQueries.at(-1)?.runId).toBe("run-2");
  });

  it("409: avisa que já existe análise em andamento e mostra o progresso", async () => {
    server.use(
      ...baseHandlers(),
      http.post(apiUrl("forecasts/generate"), () => {
        latest = runRunning;
        return HttpResponse.json(
          {
            isSuccess: false,
            errors: [
              "Já existe uma análise em andamento. Aguarde ela terminar.",
            ],
            errorCode: 409,
            message:
              "Já existe uma análise em andamento. Aguarde ela terminar.",
          },
          { status: 409 }
        );
      }),
      http.get(apiUrl("forecasts/:runId/status"), () =>
        HttpResponse.json(progress(1, 4))
      )
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Trufa de Maracujá");

    await user.click(
      screen.getByRole("button", { name: "Gerar nova análise" })
    );

    expect(
      await screen.findByText(
        "Já existe uma análise em andamento. Aguarde ela terminar."
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Em andamento/ })
    ).toBeDisabled();
    expect(await screen.findByText("Lote 1 de 4")).toBeInTheDocument();
  });

  it("sem análise: mostra o vazio com o botão de gerar", async () => {
    latest = null;
    server.use(...baseHandlers());
    renderPage();

    expect(
      await screen.findByText("Nenhuma análise ainda")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Gerar análise" })
    ).toBeInTheDocument();
    expect(recommendationQueries).toHaveLength(0);
  });

  it("quem não é Admin não vê o botão de gerar", async () => {
    auth.role = "User";
    server.use(...baseHandlers());
    renderPage();
    await screen.findAllByText("Trufa de Maracujá");

    expect(
      screen.queryByRole("button", { name: /Gerar/ })
    ).not.toBeInTheDocument();
  });
});
