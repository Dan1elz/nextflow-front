import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  Home,
  MapPin,
  Users,
  UserCircle,
  ChevronDown,
  Tag,
  Package,
  Activity,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavUser } from "./nav-user";
import { NextflowLogo } from "./NextflowLogo";
import type {
  SidebarMenuGroup,
  SidebarSubItem,
} from "@/interfaces/general.interface";

const items: SidebarMenuGroup[] = [
  {
    title: "GERAL",
    items: [
      { name: "Dashboard", url: "/", icon: Home },
    ],
  },
  {
    title: "COMERCIAL",
    items: [
      { name: "Vendas (Pedidos)", url: "/orders", icon: ShoppingCart },
      { name: "Pedidos de Compra", url: "/purchase-orders", icon: ShoppingBag },
    ],
  },
  {
    title: "GESTÃO DE ESTOQUE",
    items: [
      { name: "Produtos", url: "/products", icon: Package },
      { name: "Categorias", url: "/categories", icon: Tag },
      { name: "Movimentações", url: "/stock-movements", icon: Activity },
    ],
  },
  {
    title: "CADASTROS",
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
      {
        name: "Localidades",
        icon: MapPin,
        items: [
          { name: "Países", url: "/countries" },
          { name: "Estados", url: "/states" },
          { name: "Cidades", url: "/cities" },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Manage which group is currently open (Accordion behavior)
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isSubItemActive = useCallback((subItems?: SidebarSubItem[]) => {
    if (!subItems) return false;
    return subItems.some((subItem) =>
      location.pathname.startsWith(subItem.url)
    );
  }, [location.pathname]);

  // Set initial open group based on active route
  useEffect(() => {
    if (isCollapsed) {
      setOpenGroup(null);
      return;
    }

    const activeGroup = items
      .flatMap(g => g.items)
      .find(item => item.items && isSubItemActive(item.items));
    
    if (activeGroup) {
      setOpenGroup(activeGroup.name);
    }
  }, [isSubItemActive, isCollapsed]);

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" variant="inset">
        {/* Header */}
        <SidebarHeader
          className="border-b"
          style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)" }}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/"
                  className="w-full flex justify-center items-center gap-2"
                >
                  <NextflowLogo className="h-8 w-auto" />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent>
          {items.map((menu, index) => (
            <SidebarGroup key={index}>
              <SidebarGroupLabel>{menu.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menu.items.map((item, itemIndex) => {
                    const hasSubItems = item.items && item.items.length > 0;

                    if (hasSubItems) {
                      const isActive = isSubItemActive(item.items);

                      // If collapsed, use DropdownMenu for interaction
                      if (isCollapsed) {
                        return (
                          <SidebarMenuItem key={itemIndex}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                  isActive={isActive}
                                  tooltip={item.name}
                                >
                                  {item.icon && <item.icon />}
                                  <span>{item.name}</span>
                                </SidebarMenuButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start" className="w-48">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  {item.name}
                                </div>
                                {item.items?.map((subItem, subIndex) => (
                                  <DropdownMenuItem key={subIndex} asChild>
                                    <NavLink to={subItem.url} className="flex items-center gap-2">
                                      {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                      <span>{subItem.name}</span>
                                    </NavLink>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuItem>
                        );
                      }

                      // If expanded, use Collapsible with Accordion logic
                      return (
                        <Collapsible
                          key={itemIndex}
                          open={openGroup === item.name}
                          onOpenChange={(open) => {
                            if (open) setOpenGroup(item.name);
                            else if (openGroup === item.name) setOpenGroup(null);
                          }}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton isActive={isActive}>
                                {item.icon && <item.icon />}
                                <span>{item.name}</span>
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items?.map((subItem, subIndex) => (
                                  <SidebarMenuSubItem key={subIndex}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={location.pathname === subItem.url}
                                    >
                                      <NavLink to={subItem.url}>
                                        {subItem.icon && <subItem.icon />}
                                        <span>{subItem.name}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    // Single Item with built-in Tooltip
                    return (
                      <SidebarMenuItem key={itemIndex}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            item.url ? location.pathname === item.url : false
                          }
                          tooltip={item.name}
                        >
                          <NavLink to={item.url ?? "#"}>
                            {item.icon && <item.icon />}
                            <span>{item.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter
          className="border-t"
          style={{ borderTopColor: "rgba(255, 255, 255, 0.3)" }}
        >
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
