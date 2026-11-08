import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VariantSalePicker } from "@/components/app/variant-sale-picker";
import type { VariantSaleOptionDto } from "@/interfaces/sale-option.interface";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

vi.mock("@/hooks/use-current-store", () => ({
  useCurrentStore: () => ({ storeId: "store-1" }),
}));

// O AbortSignal do jsdom não passa no fetch do Node (vira erro de rede): a busca é simulada no serviço.
const searchSpy = vi.hoisted(() => vi.fn());
vi.mock("@/services/sale-option.service", () => ({
  saleOptionService: { getVariantOptions: searchSpy },
}));

const option = (
  overrides: Partial<VariantSaleOptionDto>
): VariantSaleOptionDto => ({
  variantId: "var-1",
  productId: "prod-1",
  productName: "Brigadeiro",
  variantLabel: null,
  sku: "DOC-001",
  barcode: "7891000100103",
  imageUrl: null,
  saleUnit: "Unit",
  decimalPlaces: 0,
  allowsNegative: false,
  listPrice: 3,
  effectivePrice: 3,
  activePromotion: null,
  availableQuantity: 10,
  locationId: "loc-1",
  nextLot: null,
  lifecycle: "Active",
  isActive: true,
  ...overrides,
});

const catalog = [
  option({}),
  option({
    variantId: "var-2",
    productName: "Beijinho",
    sku: "DOC-0010",
    barcode: "7891000100110",
  }),
];

beforeEach(() => {
  searchSpy.mockReset();
  searchSpy.mockImplementation(async ({ search }: { search: string }) => {
    const term = search.toLowerCase();
    // Como a API: contém o termo, com o código exato primeiro.
    return catalog
      .filter(
        (item) =>
          item.productName.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          item.barcode?.includes(term)
      )
      .sort((a, b) => {
        const exact = (item: VariantSaleOptionDto) =>
          item.sku.toLowerCase() === term || item.barcode === term ? 0 : 1;
        return exact(a) - exact(b);
      });
  });
});

describe("VariantSalePicker", () => {
  it("adiciona direto ao receber o código de barras completo com Enter (leitor)", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "7891000100110{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0].variantId).toBe("var-2");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("adiciona pelo SKU exato mesmo quando outro SKU começa igual", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "doc-001{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0].variantId).toBe("var-1");
  });

  it("lê dois códigos seguidos sem tirar o foco da busca", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "7891000100103{Enter}");
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    await user.type(input, "7891000100103{Enter}");
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2));
    expect(input).toHaveFocus();
  });

  it("avisa e mantém o código quando nada bate exatamente, sem escolher outro item", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "0000000000000{Enter}");

    expect(
      await screen.findByText(/Nenhum produto com o código 0000000000000/)
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    expect(input).toHaveValue("0000000000000");
  });

  it("Enter com termo parcial não escolhe sozinho o primeiro da lista", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "doc");
    await screen.findByText("Beijinho");
    await user.keyboard("{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/Nenhum produto com o código doc/)
    ).toBeInTheDocument();
  });

  it("adiciona sozinho, sem Enter, quando o termo é exatamente um código de barras", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "7891000100110");

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0].variantId).toBe("var-2");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("não adiciona sozinho quando o termo só começa igual a um código", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VariantSalePicker onSelect={onSelect} />);

    const input = screen.getByLabelText("Buscar produto para venda");
    await user.click(input);
    await user.type(input, "7891000100");
    await screen.findByText("Beijinho");

    expect(onSelect).not.toHaveBeenCalled();
    expect(input).toHaveValue("7891000100");
  });
});
