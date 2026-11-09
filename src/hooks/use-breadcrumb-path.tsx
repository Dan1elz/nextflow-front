import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import type { IBreadcrumb } from "@/types/general";

const routeNameMap: Record<string, string> = {
  users: "Usuários",
  profile: "Meu perfil",
  settings: "Configurações",
  stores: "Lojas e locais",
  create: "Criar",
  edit: "Editar",
  view: "Visualizar",
  clients: "Clientes",
  contacts: "Contatos",
  addresses: "Endereços",
  suppliers: "Fornecedores",
  products: "Produtos",
  categories: "Categorias",
  collections: "Coleções",
  "calendar-events": "Calendário de eventos",
  "purchase-orders": "Pedidos de Compra",
  "stock-movements": "Movimentações de Estoque",
  sales: "Vendas",
  history: "Histórico",
  orders: "Pedidos de Venda",
  forecast: "Previsão de Demanda (IA)",
  promotions: "Promoções",
  accuracy: "Precisão",
  promote: "Promover selecionados",
  "low-stock": "Estoque baixo",
  "expiring-lots": "Lotes vencendo",
  quick: "Venda rápida",
  "stock-policy": "Política de estoque",
};

/** Nome que depende do caminho inteiro (mesmo segmento, telas diferentes). Mesmos nomes do menu. */
const pathNameMap: Record<string, string> = {
  "/settings/forecast": "Agendamento da previsão",
  "/sales/history": "Histórico de vendas",
};

/** Segmentos sem tela própria: viram texto, sem link (o link cairia no "rota não encontrada"). */
const textOnlySegments = new Set(["sales"]);

/** Segmentos sem tela própria: o "ver mais" do painel (`/dashboard/...`) fica direto abaixo do Home, que é o painel. */
const hiddenSegments = new Set(["dashboard"]);

export function useBreadcrumbPath(): IBreadcrumb[] | null {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment !== "");

    if (pathSegments.length === 0) {
      return null;
    }

    const items: IBreadcrumb[] = [];
    let breadcrumbPath = "";

    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1;

      const isNumericId = /^\d+$/.test(segment);
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        );

      if (isNumericId || isUuid) {
        return;
      }

      breadcrumbPath += `/${segment}`;
      if (hiddenSegments.has(segment)) return;

      const name =
        pathNameMap[breadcrumbPath] ||
        routeNameMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      items.push({
        name,
        path: breadcrumbPath,
        isLast,
        textOnly: textOnlySegments.has(segment),
      });
    });

    return items.length > 0 ? items : null;
  }, [location.pathname]);

  return breadcrumbs;
}
