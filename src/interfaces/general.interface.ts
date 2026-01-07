import type { LucideIcon } from "lucide-react";

export interface SidebarSubItem {
  name: string;
  url: string;
  icon?: LucideIcon;
}

export interface SidebarMenuItem {
  name: string;
  icon: LucideIcon;
  url?: string;
  items?: SidebarSubItem[];
}

export interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}
