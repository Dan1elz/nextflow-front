import { NavLink, useLocation } from "react-router-dom";
import { Home, MapPin, Users, ChevronDown, Settings } from "lucide-react";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "./nav-user";
import { NextflowLogo } from "./NextflowLogo";
import type {
  SidebarMenuGroup,
  SidebarSubItem,
} from "@/interfaces/general.interface";

const items: SidebarMenuGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      { name: "Home", url: "/", icon: Home },
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
      {
        name: "Configurações",
        icon: Settings,
        url: "/settings",
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();

  const isSubItemActive = (subItems?: SidebarSubItem[]) => {
    if (!subItems) return false;
    return subItems.some((subItem) =>
      location.pathname.startsWith(subItem.url)
    );
  };

  return (
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
                  if (item.items && item.items.length > 0) {
                    const defaultOpen = isSubItemActive(item.items);

                    return (
                      <Collapsible
                        key={itemIndex}
                        defaultOpen={defaultOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <item.icon />
                              <span>{item.name}</span>
                              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem, subIndex) => (
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

                  return (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          item.url ? location.pathname === item.url : false
                        }
                      >
                        {item.url ? (
                          <NavLink to={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.name}</span>
                          </NavLink>
                        ) : (
                          <div>
                            {item.icon && <item.icon />}
                            <span>{item.name}</span>
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter
        className="border-t"
        style={{ borderTopColor: "rgba(255, 255, 255, 0.3)" }}
      >
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
