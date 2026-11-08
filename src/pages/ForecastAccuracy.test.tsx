import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForecastAccuracyContent } from "@/pages/ForecastAccuracy";
import { apiUrl, server } from "@/test/server";

const auth = vi.hoisted(() => ({ role: "Admin" }));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    token: "token",
    user: { name: "Daniel", role: auth.role },
  }),
}));

let productQueries: Record<string, string>[];
let summaryMonths: string | null;

beforeEach(() => {
  auth.role = "Admin";
  productQueries = [];
  summaryMonths = null;
  server.use(
    http.get(apiUrl("forecasts/accuracy/summary"), ({ request }) => {
      summaryMonths = new URL(request.url).searchParams.get("months");
      return HttpResponse.json({
        monthly: [
          { month: "2026-08", mapePercent: 10, productsMeasured: 30 },
          { month: "2026-09", mapePercent: null, productsMeasured: 0 },
          { month: "2026-10", mapePercent: 18.5, productsMeasured: 32 },
        ],
        byAbcClass: [
          { abcClass: "A", mapePercent: 8 },
          { abcClass: "B", mapePercent: 14.2 },
        ],
        byCategory: [{ categoryPath: "Chocolates > Trufas", mapePercent: 9.5 }],
        withinTolerancePercent: 68,
      });
    }),
    http.get(apiUrl("forecasts/accuracy/products"), ({ request }) => {
      const raw = new URL(request.url).searchParams.get("filters");
      productQueries.push(raw ? JSON.parse(raw) : {});
      return HttpResponse.json({
        items: [
          {
            productId: "prod-1",
            productName: "Trufa de Maracujá",
            abcClass: "A",
            monthsMeasured: 6,
            mapePercent: 12.5,
            bias: "Under",
            lastMonth: { month: "2026-10", projected: 110, actual: 100 },
          },
        ],
        total: 1,
      });
    })
  );
});

function renderPage() {
  render(
    <MemoryRouter>
      <ForecastAccuracyContent />
    </MemoryRouter>
  );
}

describe("Precisão da previsão (F3.8i, T-DF10)", () => {
  it("mostra o erro por mês, os resumos e a tolerância de ±15%", async () => {
    renderPage();

    expect(await screen.findByText("68%")).toBeInTheDocument();
    expect(summaryMonths).toBe("12");

    const monthly = screen.getByRole("table", { name: "Erro médio por mês" });
    const rows = within(monthly).getAllByRole("row");
    expect(within(rows[1]).getByText("10%")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Sem medição")).toBeInTheDocument();
    expect(within(rows[3]).getByText("18,5%")).toBeInTheDocument();

    const byClass = screen.getByRole("table", { name: "Por classe ABC" });
    expect(within(byClass).getByText("14,2%")).toBeInTheDocument();
    const byCategory = screen.getByRole("table", { name: "Por categoria" });
    expect(
      within(byCategory).getByText("Chocolates > Trufas")
    ).toBeInTheDocument();
  });

  it("lista a precisão por produto e filtra por tendência", async () => {
    const user = userEvent.setup();
    renderPage();

    const [name] = await screen.findAllByText("Trufa de Maracujá");
    const row = name.closest("tr") as HTMLElement;
    expect(within(row).getByText("12,5%")).toBeInTheDocument();
    expect(within(row).getByText("Subestima")).toBeInTheDocument();
    expect(
      within(row).getByText(/110 previsto × 100 vendido/)
    ).toBeInTheDocument();
    expect(productQueries[0]).toEqual({});

    await user.click(screen.getByRole("combobox", { name: "Tendência" }));
    await user.click(await screen.findByRole("option", { name: "Subestima" }));
    await waitFor(() =>
      expect(productQueries.at(-1)).toEqual({ bias: "Under" })
    );
  });

  it("quem não é Admin não vê a tela nem chama a API", async () => {
    auth.role = "Seller";
    renderPage();

    expect(
      await screen.findByText("Só administradores veem a precisão da previsão.")
    ).toBeInTheDocument();
    expect(summaryMonths).toBeNull();
    expect(productQueries).toEqual([]);
  });
});
