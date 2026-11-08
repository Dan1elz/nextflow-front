import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForecastHistoryContent } from "@/pages/ForecastHistory";
import { ForecastSettingsContent } from "@/pages/Settings/ForecastSettings";
import type { IForecastSettingsRequest } from "@/interfaces/forecast.interface";
import { apiUrl, server } from "@/test/server";
import { runCompleted, runFinished } from "@/test/fixtures/forecast.fixtures";
import { formatDateTime } from "@/utils/format.helpers";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

function CurrentUrl() {
  const location = useLocation();
  return <p data-testid="url">{location.pathname + location.search}</p>;
}

describe("Histórico de análises (F3.8h, T-DF9)", () => {
  let queries: Record<string, string>[];

  beforeEach(() => {
    queries = [];
    server.use(
      http.get(apiUrl("forecasts"), ({ request }) => {
        const raw = new URL(request.url).searchParams.get("filters");
        queries.push(raw ? JSON.parse(raw) : {});
        return HttpResponse.json({
          items: [
            runFinished,
            { ...runCompleted, batches: { total: 8, completed: 7, failed: 1 } },
          ],
          total: 2,
        });
      }),
      http.get(apiUrl("forecasts/:runId/batches"), () =>
        HttpResponse.json([
          {
            batchNumber: 1,
            productsCount: 40,
            status: "Completed",
            errorMessage: null,
            durationMs: 12_000,
          },
          {
            batchNumber: 2,
            productsCount: 8,
            status: "Failed",
            errorMessage: "Tempo esgotado na IA",
            durationMs: null,
          },
        ])
      )
    );
  });

  function renderHistory() {
    render(
      <MemoryRouter initialEntries={["/forecast/history"]}>
        <Routes>
          <Route
            path="/forecast/history"
            element={<ForecastHistoryContent />}
          />
          <Route path="/forecast" element={<CurrentUrl />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("lista as análises com origem, status, lotes com falha e contagens", async () => {
    renderHistory();

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getByText("Manual")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Semanal")).toBeInTheDocument();
    expect(within(rows[2]).getByText("1 com falha")).toBeInTheDocument();
    expect(within(rows[2]).getAllByText("Concluída").length).toBeGreaterThan(0);
    expect(queries[0]).toEqual({});
  });

  it("filtra por status e abre a análise na tela da previsão", async () => {
    const user = userEvent.setup();
    renderHistory();
    await screen.findByRole("table");

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Falhou" }));
    await waitFor(() => expect(queries.at(-1)).toEqual({ status: "Failed" }));

    const [open] = screen.getAllByRole("button", {
      name: formatDateTime(runFinished.createdAt),
    });
    await user.click(open);
    expect(await screen.findByTestId("url")).toHaveTextContent(
      "/forecast?run=run-2"
    );
  });

  it("mostra os lotes da análise com o erro de cada um", async () => {
    const user = userEvent.setup();
    renderHistory();
    await screen.findByRole("table");

    const [batches] = screen.getAllByRole("button", {
      name: `Lotes da análise de ${formatDateTime(runCompleted.createdAt)}`,
    });
    await user.click(batches);

    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByText("Tempo esgotado na IA")
    ).toBeVisible();
    expect(within(dialog).getByText("Falhou")).toBeInTheDocument();
  });
});

describe("Agendamento da análise (F3.8h, T-DF11)", () => {
  let saved: IForecastSettingsRequest[];

  beforeEach(() => {
    saved = [];
    server.use(
      http.get(apiUrl("settings/forecast"), () =>
        HttpResponse.json({
          scheduleEnabled: true,
          weekday: 1,
          time: "06:00",
          aiBatchSize: 40,
          aiConfigured: false,
          nextScheduledAt: "2026-11-09T09:00:00Z",
        })
      ),
      http.put(apiUrl("settings/forecast"), async ({ request }) => {
        const body = (await request.json()) as IForecastSettingsRequest;
        saved.push(body);
        return HttpResponse.json({
          ...body,
          aiConfigured: false,
          nextScheduledAt: "2026-11-09T10:30:00Z",
        });
      })
    );
  });

  it("salvar o agendamento mostra a próxima execução", async () => {
    const user = userEvent.setup();
    render(<ForecastSettingsContent />);

    const time = await screen.findByLabelText("Hora");
    expect(time).toHaveValue("06:00");
    expect(screen.getByText(/Chave da IA não configurada/)).toBeInTheDocument();

    await user.clear(time);
    await user.type(time, "07:30");
    const batch = screen.getByLabelText("Produtos por lote da IA");
    await user.clear(batch);
    await user.type(batch, "30");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(saved).toEqual([
        { scheduleEnabled: true, weekday: 1, time: "07:30", aiBatchSize: 30 },
      ])
    );
    expect(
      await screen.findByText(formatDateTime("2026-11-09T10:30:00Z"))
    ).toBeInTheDocument();
  });

  it("lote fora de 1 a 100 mostra o erro no campo e não salva", async () => {
    const user = userEvent.setup();
    render(<ForecastSettingsContent />);

    const batch = await screen.findByLabelText("Produtos por lote da IA");
    await user.clear(batch);
    await user.type(batch, "0");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("O lote da IA deve ter de 1 a 100 produtos.")
    ).toBeInTheDocument();
    expect(batch).toHaveAttribute("aria-invalid", "true");
    expect(saved).toEqual([]);
  });
});
