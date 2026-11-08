import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplyPurchaseDialog } from "@/components/app/apply-purchase-dialog";
import type {
  IApplyPurchaseRequest,
  IForecastRecommendationListItem,
} from "@/interfaces/forecast.interface";
import { apiUrl, server } from "@/test/server";
import {
  recommendationDetail,
  recommendationNoSupplier,
  recommendationNoSupplierDetail,
  recommendationsRun1,
} from "@/test/fixtures/forecast.fixtures";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

vi.mock("@/hooks/use-current-store", () => ({
  useCurrentStore: () => ({ storeId: "store-1" }),
}));

const rec1 = recommendationsRun1.items[0];
let posted: IApplyPurchaseRequest[];
let purchaseResponse: () => Response;

beforeEach(() => {
  posted = [];
  purchaseResponse = () =>
    HttpResponse.json({
      purchaseOrders: [
        { id: "po-1", number: 31, supplierName: "Cacau Sul", total: 840 },
      ],
      recommendations: [{ ...rec1, status: "Applied" }],
    });
  server.use(
    http.get(apiUrl("forecasts/recommendations/:id"), ({ params }) =>
      HttpResponse.json(
        params.id === "rec-3"
          ? recommendationNoSupplierDetail
          : recommendationDetail
      )
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
        {
          id: "loc-2",
          name: "Depósito",
          storeId: "store-1",
          storeName: "Loja Centro",
          isSellable: false,
        },
      ])
    ),
    http.get(apiUrl("stores/:id"), () =>
      HttpResponse.json({ id: "store-1", defaultReceiveLocationId: "loc-1" })
    ),
    http.get(apiUrl("purchase-orders/item-suggestion"), ({ request }) => {
      const variantId = new URL(request.url).searchParams.get("variantId");
      return HttpResponse.json({
        variantId,
        lastCostFromSupplier: variantId === "var-1" ? 3.5 : null,
        lastCost: 2,
        averageCost: 1.9,
      });
    }),
    http.post(
      apiUrl("forecasts/recommendations/purchase"),
      async ({ request }) => {
        posted.push((await request.json()) as IApplyPurchaseRequest);
        return purchaseResponse();
      }
    )
  );
});

function renderDialog(
  recommendations: IForecastRecommendationListItem[],
  onApplied = vi.fn()
) {
  render(
    <MemoryRouter>
      <ApplyPurchaseDialog
        open
        onOpenChange={() => {}}
        recommendations={recommendations}
        onApplied={onApplied}
      />
    </MemoryRouter>
  );
  return onApplied;
}

const storeSplitResponse = {
  recommendationId: "rec-1",
  orderMultiple: 12,
  stores: [
    {
      storeId: "store-1",
      storeName: "Loja Centro",
      receiveLocationId: "loc-1",
      receiveLocationName: "Recebimento",
      sharePercent: 60,
      currentStock: 10,
      incomingStock: 0,
      shortfall: 120,
      quantity: 144,
    },
    {
      storeId: "store-2",
      storeName: "Loja Shopping",
      receiveLocationId: "loc-9",
      receiveLocationName: "Depósito",
      sharePercent: 40,
      currentStock: 5,
      incomingStock: 0,
      shortfall: 80,
      quantity: 96,
    },
  ],
  items: [
    {
      variantId: "var-1",
      quantity: 144,
      byStore: [
        { storeId: "store-1", quantity: 84 },
        { storeId: "store-2", quantity: 60 },
      ],
    },
    {
      variantId: "var-2",
      quantity: 96,
      byStore: [
        { storeId: "store-1", quantity: 60 },
        { storeId: "store-2", quantity: 36 },
      ],
    },
  ],
};

const qty = (name: string) =>
  screen.findByRole("spinbutton", { name: `Quantidade de ${name}` });
const cost = (name: string) =>
  screen.findByRole("spinbutton", { name: `Custo unitário de ${name}` });

describe("Comprar (F3.8f, T-DF4)", () => {
  it("parte do rateio e do último custo, e gera um pedido por fornecedor", async () => {
    const onApplied = renderDialog([rec1]);

    const dialog = await screen.findByRole("dialog", {
      name: "Gerar pedido de compra",
    });
    expect(within(dialog).getByText("Cacau Sul")).toBeInTheDocument();
    expect(await qty("Trufa de Maracujá (Caixa com 6)")).toHaveValue(144);
    expect(await qty("Trufa de Maracujá (Caixa com 12)")).toHaveValue(96);
    await waitFor(async () =>
      expect(await cost("Trufa de Maracujá (Caixa com 6)")).toHaveValue(3.5)
    );
    // sem custo do fornecedor, usa o último custo do produto
    expect(await cost("Trufa de Maracujá (Caixa com 12)")).toHaveValue(2);

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Gerar pedido de compra" })
    );

    await waitFor(() => expect(onApplied).toHaveBeenCalled());
    expect(posted).toEqual([
      {
        groups: [
          {
            supplierId: "sup-1",
            receiveLocationId: "loc-1",
            note: null,
            items: [
              {
                recommendationId: "rec-1",
                variantId: "var-1",
                quantity: 144,
                unitCost: 3.5,
              },
              {
                recommendationId: "rec-1",
                variantId: "var-2",
                quantity: 96,
                unitCost: 2,
              },
            ],
          },
        ],
      },
    ]);
    expect(onApplied.mock.calls[0][0].recommendations[0].status).toBe(
      "Applied"
    );
  });

  it("avisa mínimo e múltiplo sem bloquear, e oferece arredondar", async () => {
    renderDialog([rec1]);
    const user = userEvent.setup();

    const line = await qty("Trufa de Maracujá (Caixa com 6)");
    await user.clear(line);
    await user.type(line, "10");

    expect(
      await screen.findByText(/Abaixo do pedido mínimo de 24 un/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Fora do múltiplo de 12 un/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Arredondar para 12" })
    );
    expect(line).toHaveValue(12);
    expect(
      screen.queryByText(/Fora do múltiplo de 12 un/)
    ).not.toBeInTheDocument();

    await user.clear(line);
    await user.type(line, "10");
    await user.click(
      screen.getByRole("button", { name: "Gerar pedido de compra" })
    );
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].groups[0].items[0].quantity).toBe(10);
  });

  it("vários produtos: sem fornecedor preferido pede a escolha antes de enviar", async () => {
    renderDialog([rec1, recommendationNoSupplier]);

    const dialog = await screen.findByRole("dialog", {
      name: "Comprar 2 produtos",
    });
    const choose = await within(dialog).findByRole("region", {
      name: "Escolha o fornecedor",
    });
    expect(within(choose).getByText("Bombom de Coco")).toBeInTheDocument();
    await qty("Bombom de Coco");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Gerar pedidos" })
    );
    expect(
      await within(choose).findByText("Escolha o fornecedor.")
    ).toBeInTheDocument();
    expect(posted).toEqual([]);
  });

  it("mostra o 422 do servidor na linha certa", async () => {
    purchaseResponse = () =>
      HttpResponse.json(
        {
          message: "Revise os itens.",
          fieldErrors: {
            "groups[0].items[1].quantity": ["Variação inativa."],
          },
        },
        { status: 422 }
      );
    const onApplied = renderDialog([rec1]);
    await qty("Trufa de Maracujá (Caixa com 12)");
    await waitFor(async () =>
      expect(await cost("Trufa de Maracujá (Caixa com 6)")).toHaveValue(3.5)
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Gerar pedido de compra" })
    );

    const field = await qty("Trufa de Maracujá (Caixa com 12)");
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("Variação inativa.")).toBeInTheDocument();
    expect(onApplied).not.toHaveBeenCalled();
  });

  it("divide entre lojas pela sugestão e gera um pedido por loja (RN-DF27)", async () => {
    server.use(
      http.get(apiUrl("forecasts/recommendations/:id/store-split"), () =>
        HttpResponse.json(storeSplitResponse)
      )
    );
    const onApplied = renderDialog([rec1]);
    const user = userEvent.setup();
    const dialog = await screen.findByRole("dialog", {
      name: "Gerar pedido de compra",
    });
    await waitFor(async () =>
      expect(await cost("Trufa de Maracujá (Caixa com 6)")).toHaveValue(3.5)
    );

    await user.click(
      within(dialog).getByRole("switch", { name: "Dividir entre lojas" })
    );
    expect(
      await within(dialog).findByText("Loja Shopping")
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Gerar pedido de compra" })
    );

    await waitFor(() => expect(onApplied).toHaveBeenCalled());
    const groups = posted[0].groups;
    expect(groups.map((g) => g.receiveLocationId)).toEqual(["loc-1", "loc-9"]);
    expect(groups[0].items.map((i) => i.quantity)).toEqual([84, 60]);
    expect(groups[1].items.map((i) => i.quantity)).toEqual([60, 36]);
    expect(groups.every((g) => g.supplierId === "sup-1")).toBe(true);
  });
  it("abre já dividido quando a análise gravou a parte de cada loja", async () => {
    server.use(
      http.get(apiUrl("forecasts/recommendations/:id/store-split"), () =>
        HttpResponse.json(storeSplitResponse)
      )
    );
    renderDialog([
      {
        ...rec1,
        storeSplit: [
          {
            storeId: "store-1",
            storeName: "Loja Centro",
            sharePercent: 60,
            shortfall: 120,
            quantity: 144,
          },
          {
            storeId: "store-2",
            storeName: "Loja Shopping",
            sharePercent: 40,
            shortfall: 80,
            quantity: 96,
          },
        ],
      },
    ]);
    const dialog = await screen.findByRole("dialog", {
      name: "Gerar pedido de compra",
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("switch", { name: "Dividir entre lojas" })
      ).toBeChecked()
    );
    expect(
      within(dialog).queryByLabelText("Local de entrega")
    ).not.toBeInTheDocument();
  });
});
