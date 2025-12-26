import { NavLink } from "react-router-dom";
import { Home, Users } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { NextflowLogo } from "./NextflowLogo";

const items = [
  {
    title: "PRINCIPAL",
    items: [
      { name: "Home", url: "/", icon: Home },
      { name: "Usuários", url: "/users", icon: Users },
    ],
  },
];

export function AppSidebar() {
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
                {menu.items.map((item, itemIndex) => (
                  <SidebarMenuItem key={itemIndex}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
