import {
  Activity,
  BadgePercent,
  CalendarDays,
  Home,
  History,
  Layers,
  Package,
  ScanBarcode,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  UserCircle,
  Users,
} from "lucide-react";
import type { SidebarMenuGroup } from "@/interfaces/general.interface";

/** Fonte única da navegação: sidebar e paleta de comandos leem daqui. */
export const navigation: SidebarMenuGroup[] = [
  {
    title: "Geral",
    items: [
      { name: "Dashboard", url: "/", icon: Home },
      { name: "Previsão (IA)", url: "/forecast", icon: Sparkles },
    ],
  },
  {
    title: "Comercial",
    items: [
      { name: "Venda rápida", url: "/sales/quick", icon: ScanBarcode },
      { name: "Histórico de vendas", url: "/sales/history", icon: History },
      { name: "Pedidos de Compra", url: "/purchase-orders", icon: ShoppingBag },
      { name: "Promoções", url: "/promotions", icon: BadgePercent },
    ],
  },
  {
    title: "Estoque",
    items: [
      { name: "Produtos", url: "/products", icon: Package },
      { name: "Categorias", url: "/categories", icon: Tag },
      { name: "Coleções", url: "/collections", icon: Layers },
      { name: "Calendário", url: "/calendar-events", icon: CalendarDays },
      { name: "Movimentações", url: "/stock-movements", icon: Activity },
    ],
  },
  {
    title: "Cadastros",
    items: [
      {
        name: "Pessoas",
        icon: UserCircle,
        items: [
          { name: "Clientes", url: "/clients" },
          { name: "Fornecedores", url: "/suppliers" },
        ],
      },
      { name: "Usuários", url: "/users", icon: Users },
    ],
  },
  {
    title: "Configurações",
    items: [
      { name: "Lojas e locais", url: "/settings/stores", icon: Store },
      {
        name: "Política de estoque",
        url: "/settings/stock-policy",
        icon: SlidersHorizontal,
      },
    ],
  },
];
