import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductForecastTab } from "@/components/app/product-forecast-tab";
import { RecommendationDetailSheet } from "@/components/app/recommendation-detail-sheet";
import { apiUrl, server } from "@/test/server";
import {
  productForecast,
  recommendationDetail,
} from "@/test/fixtures/forecast.fixtures";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

let detailCalls: string[];

beforeEach(() => {
  detailCalls = [];
  server.use(
    http.get(apiUrl("forecasts/recommendations/:id"), ({ params }) => {
      detailCalls.push(String(params.id));
      return HttpResponse.json(recommendationDetail);
    })
  );
});

describe("Detalhe da recomendação (F3.8e, T-DF3)", () => {
  it("mostra o rateio por variação e o total bate com a quantidade sugerida", async () => {
    render(
      <RecommendationDetailSheet recommendationId="rec-1" onClose={() => {}} />
    );

    const sheet = await screen.findByRole("dialog", {
      name: "Trufa de Maracujá",
    });
    const split = await within(sheet).findByRole("table", {
      name: "Rateio por variação",
    });
    const rows = within(split).getAllByRole("row");
    expect(within(rows[1]).getByText("Caixa com 6")).toBeInTheDocument();
    expect(within(rows[1]).getByText("60%")).toBeInTheDocument();
    expect(within(rows[1]).getByText("144 un")).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Loja Centro: 5/)).toBeInTheDocument();
    expect(within(rows[2]).getByText("96 un")).toBeInTheDocument();

    const total = rows[rows.length - 1];
    expect(within(total).getByText("Total")).toBeInTheDocument();
    expect(within(total).getByText("240 un")).toBeInTheDocument();
    expect(
      within(sheet).queryByText(/não fecha com a quantidade sugerida/)
    ).not.toBeInTheDocument();
    expect(detailCalls).toEqual(["rec-1"]);
  });

  it("mostra o que a IA mudou e a memória do cálculo", async () => {
    render(
      <RecommendationDetailSheet recommendationId="rec-1" onClose={() => {}} />
    );

    const sheet = await screen.findByRole("dialog", {
      name: "Trufa de Maracujá",
    });
    expect(
      await within(sheet).findByText(/200 un calculadas → 240 un/)
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(recommendationDetail.reasonAi as string)
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(recommendationDetail.reasonCalculated)
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(/7 dias \(média dos recebimentos\)/)
    ).toBeInTheDocument();
    expect(within(sheet).getByText("Natal")).toBeInTheDocument();
  });

  it("avisa quando o rateio não fecha com a quantidade sugerida", async () => {
    server.use(
      http.get(apiUrl("forecasts/recommendations/:id"), () =>
        HttpResponse.json({ ...recommendationDetail, suggestedQuantity: 250 })
      )
    );
    render(
      <RecommendationDetailSheet recommendationId="rec-1" onClose={() => {}} />
    );

    expect(
      await screen.findByText(/não fecha com a quantidade sugerida/)
    ).toBeInTheDocument();
  });

  it("fecha pelo botão do painel", async () => {
    const onClose = vi.fn();
    render(
      <RecommendationDetailSheet recommendationId="rec-1" onClose={onClose} />
    );
    await screen.findByRole("dialog", { name: "Trufa de Maracujá" });

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Aba Previsão do produto (F3.8e, T-DF5)", () => {
  it("mostra a recomendação mais recente e a precisão das projeções", async () => {
    server.use(
      http.get(apiUrl("forecasts/products/:productId"), () =>
        HttpResponse.json(productForecast)
      )
    );
    render(<ProductForecastTab productId="prod-1" />);

    expect(
      await screen.findByRole("table", { name: "Rateio por variação" })
    ).toBeInTheDocument();
    expect(detailCalls).toEqual(["rec-1"]);

    const accuracy = screen.getByRole("table", { name: "Precisão" });
    const rows = within(accuracy).getAllByRole("row");
    expect(within(rows[1]).getByText("10%")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Fora")).toBeInTheDocument();
  });

  it("sem recomendação, mostra só a previsão do produto", async () => {
    server.use(
      http.get(apiUrl("forecasts/products/:productId"), () =>
        HttpResponse.json({ ...productForecast, latestRecommendationId: null })
      )
    );
    render(<ProductForecastTab productId="prod-1" />);

    expect(
      await screen.findByText("Nenhuma recomendação para este produto")
    ).toBeInTheDocument();
    expect(screen.getByText("Natal")).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: "Rateio por variação" })
    ).not.toBeInTheDocument();
    expect(detailCalls).toEqual([]);
  });
});
