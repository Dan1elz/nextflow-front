import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUser() {
  const { user, logout } = useAuth();

  const getInitials = (name: string, lastName: string): string => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" onClick={logout}>
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
              {user ? getInitials(user.name, user.lastName) : "U"}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user ? `${user.name} ${user.lastName}` : "Usuário"}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {user?.email}
              </span>
            </div>
          </div>
          <LogOut className="ml-auto size-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
