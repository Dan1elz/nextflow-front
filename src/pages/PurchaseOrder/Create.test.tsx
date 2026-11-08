import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreatePurchaseOrder from "@/pages/PurchaseOrder/Create";
import { apiUrl, server } from "@/test/server";

const currentStore = vi.hoisted(() => ({ storeId: null as string | null }));

vi.mock("@/hooks/use-current-store", () => ({
  useCurrentStore: () => currentStore,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

const locations = [
  {
    id: "loc-centro-estoque",
    name: "Estoque",
    storeId: "store-centro",
    storeName: "Centro",
    isSellable: false,
  },
  {
    id: "loc-centro-balcao",
    name: "Balcão",
    storeId: "store-centro",
    storeName: "Centro",
    isSellable: true,
  },
  {
    id: "loc-shopping-estoque",
    name: "Estoque",
    storeId: "store-shopping",
    storeName: "Shopping",
    isSellable: false,
  },
];

function handlers(defaultReceiveLocationId: string | null) {
  return [
    http.get(apiUrl("stock-locations/options"), () =>
      HttpResponse.json(locations)
    ),
    http.get(apiUrl("stores/:id"), ({ params }) =>
      HttpResponse.json({ id: params.id, defaultReceiveLocationId })
    ),
  ];
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CreatePurchaseOrder />
    </MemoryRouter>
  );
}

beforeEach(() => {
  currentStore.storeId = null;
});

describe("Novo pedido de compra pela loja do topo", () => {
  it("em todas as lojas pede para escolher uma loja e não mostra o formulário", () => {
    server.use(...handlers(null));
    renderPage();

    expect(screen.getByText("Selecione uma loja")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Criar orçamento" })
    ).not.toBeInTheDocument();
  });

  it("com loja selecionada, o local de recebimento padrão vem preenchido e travado", async () => {
    currentStore.storeId = "store-centro";
    server.use(...handlers("loc-centro-estoque"));
    const { container } = renderPage();

    expect(
      await screen.findByText(
        "Local de recebimento padrão da loja selecionada no topo."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Local de entrega" })
    ).toBeDisabled();
    // O Select do Radix guarda o valor num <select> escondido dentro do form.
    await waitFor(() =>
      expect(container.querySelector("select")).toHaveValue(
        "loc-centro-estoque"
      )
    );
  });

  it("sem local padrão, deixa escolher só entre os locais da loja", async () => {
    currentStore.storeId = "store-centro";
    server.use(...handlers(null));
    renderPage();

    const trigger = screen.getByRole("combobox", { name: "Local de entrega" });
    await waitFor(() => expect(trigger).toBeEnabled());
    await userEvent.click(trigger);

    expect(
      await screen.findByRole("option", { name: "Centro › Balcão" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Shopping › Estoque" })
    ).not.toBeInTheDocument();
  });
});
