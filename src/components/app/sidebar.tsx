import { NavLink, useLocation } from "react-router-dom";
import { useState, useCallback } from "react";
import { ChevronDown, Pin, PinOff } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavUser } from "./nav-user";
import { NextflowLogo, NextflowMark } from "./NextflowLogo";
import { navigation } from "@/configs/navigation";
import type { SidebarSubItem } from "@/interfaces/general.interface";

const items = navigation;

export function AppSidebar() {
  const location = useLocation();
  const { state, pinned, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Manage which group is currently open (Accordion behavior)
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isSubItemActive = useCallback(
    (subItems?: SidebarSubItem[]) => {
      if (!subItems) return false;
      return subItems.some((subItem) =>
        location.pathname.startsWith(subItem.url)
      );
    },
    [location.pathname]
  );

  // Sync openGroup with isCollapsed and location during rendering
  const [prevIsCollapsed, setPrevIsCollapsed] = useState(isCollapsed);
  const [prevPath, setPrevPath] = useState(location.pathname);

  if (isCollapsed !== prevIsCollapsed || location.pathname !== prevPath) {
    setPrevIsCollapsed(isCollapsed);
    setPrevPath(location.pathname);

    if (isCollapsed) {
      if (openGroup !== null) setOpenGroup(null);
    } else {
      const activeGroup = items
        .flatMap((g) => g.items)
        .find((item) => item.items && isSubItemActive(item.items));

      if (activeGroup && openGroup !== activeGroup.name) {
        setOpenGroup(activeGroup.name);
      }
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" variant="inset">
        {/* Header */}
        <SidebarHeader className="px-3 pt-5 pb-3">
          <div
            className={cn(
              "flex h-10 items-center",
              isCollapsed ? "justify-center" : "justify-between gap-2 pl-1"
            )}
          >
            <NavLink
              to="/"
              aria-label="Nextflow"
              className="flex h-10 items-center justify-center transition-transform duration-300 ease-apple hover:scale-[1.03]"
            >
              {isCollapsed ? (
                <NextflowMark className="h-7 w-auto" />
              ) : (
                <NextflowLogo className="h-8 w-auto" />
              )}
            </NavLink>
            {!isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={
                      pinned ? "Soltar barra lateral" : "Fixar barra lateral"
                    }
                    aria-pressed={pinned}
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] duration-200 ease-apple hover:bg-sidebar-accent hover:text-foreground active:scale-90 animate-in fade-in zoom-in-90 duration-300",
                      pinned && "bg-primary/10 text-primary hover:text-primary"
                    )}
                  >
                    {pinned ? (
                      <PinOff className="size-4" />
                    ) : (
                      <Pin className="size-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {pinned ? "Soltar barra lateral" : "Fixar barra lateral"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent>
          {items.map((menu, index) => (
            <SidebarGroup key={index}>
              {index > 0 && (
                <div
                  aria-hidden
                  className="mx-auto mb-1 hidden h-px w-6 rounded-full bg-sidebar-foreground/20 group-data-[collapsible=icon]:block"
                />
              )}
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
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                className="w-48"
                              >
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  {item.name}
                                </div>
                                {item.items?.map((subItem, subIndex) => (
                                  <DropdownMenuItem key={subIndex} asChild>
                                    <NavLink
                                      to={subItem.url}
                                      className="flex items-center gap-2"
                                    >
                                      {subItem.icon && (
                                        <subItem.icon className="h-4 w-4" />
                                      )}
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
                            else if (openGroup === item.name)
                              setOpenGroup(null);
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
                                      isActive={
                                        location.pathname === subItem.url
                                      }
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

        <SidebarFooter className="p-3">
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
