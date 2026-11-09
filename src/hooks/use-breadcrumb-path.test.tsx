import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { useBreadcrumbPath } from "@/hooks/use-breadcrumb-path";

const crumbs = (path: string) =>
  renderHook(() => useBreadcrumbPath(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    ),
  }).result.current?.map((c) => [c.name, c.textOnly ?? false]);

describe("breadcrumb", () => {
  it("ver mais do painel fica direto abaixo do Home", () => {
    expect(crumbs("/dashboard/expiring-lots")).toEqual([
      ["Lotes vencendo", false],
    ]);
    expect(crumbs("/dashboard/low-stock")).toEqual([["Estoque baixo", false]]);
  });

  it("usa os nomes do menu e não liga segmento sem tela", () => {
    expect(crumbs("/sales/quick")).toEqual([
      ["Vendas", true],
      ["Venda rápida", false],
    ]);
    expect(crumbs("/settings/stock-policy")).toEqual([
      ["Configurações", false],
      ["Política de estoque", false],
    ]);
    expect(crumbs("/settings/forecast")?.[1]).toEqual([
      "Agendamento da previsão",
      false,
    ]);
    expect(crumbs("/forecast/promote")?.[1]).toEqual([
      "Promover selecionados",
      false,
    ]);
  });
});
