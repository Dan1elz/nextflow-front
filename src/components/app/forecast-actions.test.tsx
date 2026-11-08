import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplyPromotionDialog } from "@/components/app/apply-promotion-dialog";
import { DismissRecommendationDialog } from "@/components/app/dismiss-recommendation-dialog";
import type {
  IApplyPromotionRequest,
  IDismissRecommendationRequest,
} from "@/interfaces/forecast.interface";
import { apiUrl, server } from "@/test/server";
import {
  recommendationsRun1,
  recommendationsRun2,
} from "@/test/fixtures/forecast.fixtures";
import { addDaysToDateOnly, getTodayDateOnly } from "@/utils/date.helpers";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

const buyRec = recommendationsRun1.items[0];
const promoteRec = recommendationsRun2.items[0];

describe("Descartar (F3.8g, T-DF8)", () => {
  let posted: IDismissRecommendationRequest[];

  beforeEach(() => {
    posted = [];
    server.use(
      http.post(
        apiUrl("forecasts/recommendations/:id/dismiss"),
        async ({ request }) => {
          posted.push((await request.json()) as IDismissRecommendationRequest);
          return HttpResponse.json({ ...buyRec, status: "Dismissed" });
        }
      )
    );
  });

  function renderDismiss(onDone = vi.fn()) {
    render(
      <DismissRecommendationDialog
        recommendation={buyRec}
        onOpenChange={() => {}}
        onDone={onDone}
      />
    );
    return onDone;
  }

  it("Outro sem texto mostra o erro no campo e não envia", async () => {
    const user = userEvent.setup();
    renderDismiss();

    const dialog = await screen.findByRole("dialog", {
      name: "Descartar recomendação",
    });
    await user.click(within(dialog).getByRole("radio", { name: "Outro" }));
    await user.click(within(dialog).getByRole("button", { name: "Descartar" }));

    const note = within(dialog).getByRole("textbox", { name: /Descreva/ });
    expect(await within(dialog).findByText("Descreva o motivo.")).toBeVisible();
    expect(note).toHaveAttribute("aria-invalid", "true");
    expect(posted).toEqual([]);

    await user.type(note, "Fornecedor vai descontinuar a caixa");
    await user.click(within(dialog).getByRole("button", { name: "Descartar" }));
    await waitFor(() =>
      expect(posted).toEqual([
        { reasonCode: "Other", note: "Fornecedor vai descontinuar a caixa" },
      ])
    );
  });

  it("sem motivo envia corpo vazio e devolve a linha descartada", async () => {
    const onDone = renderDismiss();

    await userEvent.click(
      await screen.findByRole("button", { name: "Descartar" })
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(posted).toEqual([{ reasonCode: null, note: null }]);
    expect(onDone.mock.calls[0][0].status).toBe("Dismissed");
  });

  it("mostra o 422 do servidor no campo do texto", async () => {
    server.use(
      http.post(apiUrl("forecasts/recommendations/:id/dismiss"), () =>
        HttpResponse.json(
          { message: "Revise.", fieldErrors: { note: ["Texto inválido."] } },
          { status: 422 }
        )
      )
    );
    const user = userEvent.setup();
    const onDone = renderDismiss();

    await user.click(await screen.findByRole("radio", { name: "Outro" }));
    await user.type(screen.getByRole("textbox", { name: /Descreva/ }), "x");
    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(await screen.findByText("Texto inválido.")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("Promover (F3.8g, T-DF6)", () => {
  let posted: IApplyPromotionRequest[];
  let belowCost: boolean;

  beforeEach(() => {
    posted = [];
    belowCost = false;
    server.use(
      http.get(apiUrl("promotions/preview"), ({ request }) => {
        const pct = Number(
          new URL(request.url).searchParams.get("discountPercent")
        );
        return HttpResponse.json({
          variants: [
            {
              variantId: "var-1",
              variantLabel: "500 g",
              listPrice: 40,
              promoPrice: 40 * (1 - pct / 100),
              averageCost: 20,
              marginPercent: 41.2,
              belowCost: false,
            },
            {
              variantId: "var-2",
              variantLabel: "1 kg",
              listPrice: 70,
              promoPrice: 70 * (1 - pct / 100),
              averageCost: 45,
              marginPercent: 24.4,
              belowCost: false,
            },
          ],
        });
      }),
      http.post(
        apiUrl("forecasts/recommendations/:id/promotion"),
        async ({ request }) => {
          const body = (await request.json()) as IApplyPromotionRequest;
          posted.push(body);
          if (belowCost && !body.confirmWarnings)
            return HttpResponse.json(
              {
                message: "Abaixo do custo.",
                fieldErrors: {
                  confirm: [
                    "A promoção deixa o preço abaixo do custo médio. Deseja continuar?",
                  ],
                },
              },
              { status: 422 }
            );
          return HttpResponse.json({
            promotionIds: ["promo-1"],
            recommendation: { ...promoteRec, status: "Applied" },
          });
        }
      )
    );
  });

  function renderPromote(onDone = vi.fn()) {
    render(
      <ApplyPromotionDialog
        recommendation={promoteRec}
        onOpenChange={() => {}}
        onDone={onDone}
      />
    );
    return onDone;
  }

  it("parte da sugestão, mostra a prévia e cria a promoção", async () => {
    const onDone = renderPromote();
    const today = getTodayDateOnly();

    const dialog = await screen.findByRole("dialog", {
      name: "Aplicar promoção",
    });
    expect(within(dialog).getByLabelText("Desconto (%)")).toHaveValue("15");
    const preview = await within(dialog).findByRole("table", {
      name: "Prévia por variação",
    });
    expect(within(preview).getByText("500 g")).toBeInTheDocument();
    expect(within(preview).getByText(/34,00/)).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Aplicar promoção" })
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(posted).toEqual([
      {
        discountPercent: 15,
        startDate: today,
        endDate: addDaysToDateOnly(today, 9),
        variantIds: null,
        confirmWarnings: false,
      },
    ]);
    expect(onDone.mock.calls[0][0].status).toBe("Applied");
  });

  it("abaixo do custo pede confirmação e reenvia", async () => {
    belowCost = true;
    const user = userEvent.setup();
    const onDone = renderPromote();

    await screen.findByRole("table", { name: "Prévia por variação" });
    await user.click(screen.getByRole("button", { name: "Aplicar promoção" }));

    const confirm = await screen.findByRole("alertdialog");
    expect(
      within(confirm).getByText(/abaixo do custo médio/)
    ).toBeInTheDocument();
    await user.click(
      within(confirm).getByRole("button", { name: /Continuar|Confirmar/ })
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(posted.map((p) => p.confirmWarnings)).toEqual([false, true]);
  });

  it("variações escolhidas exigem ao menos uma e vão no corpo", async () => {
    const user = userEvent.setup();
    renderPromote();

    await screen.findByRole("table", { name: "Prévia por variação" });
    await user.click(
      screen.getByRole("radio", { name: "Variações escolhidas" })
    );
    await user.click(screen.getByRole("button", { name: "Aplicar promoção" }));
    expect(
      await screen.findByText("Escolha ao menos uma variação.")
    ).toBeInTheDocument();
    expect(posted).toEqual([]);

    await user.click(screen.getByRole("checkbox", { name: "1 kg" }));
    await user.click(screen.getByRole("button", { name: "Aplicar promoção" }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].variantIds).toEqual(["var-2"]);
  });
});
