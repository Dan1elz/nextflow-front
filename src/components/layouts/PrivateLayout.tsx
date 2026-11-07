import React from "react";
import { Outlet, Link } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";
import { StoreSelector } from "@/components/app/store-selector";
import { PageTransition } from "@/components/motion/page-transition";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbPath } from "@/hooks/use-breadcrumb-path";
import type { IBreadcrumb } from "@/types/general";
import { ToggleTheme } from "./ToggleTheme";

export default function PrivateLayout() {
  const breadcrumbItemsData = useBreadcrumbPath();

  return (
    <SidebarProvider>
      <div
        aria-hidden
        className="app-glow pointer-events-none fixed inset-0 z-0 dark:opacity-80"
      />
      <AppSidebar />
      <SidebarInset className="relative z-10 min-w-0">
        <header className="relative z-30 flex h-16 items-center gap-3 px-4 md:px-8">
          {/* No desktop a sidebar expande ao passar o mouse; o gatilho só serve no mobile */}
          <SidebarTrigger className="-ml-1 rounded-lg md:hidden" />
          <Breadcrumb className="hidden min-w-0 sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbItemsData && breadcrumbItemsData.length > 0 && (
                <>
                  <BreadcrumbSeparator />
                  {breadcrumbItemsData.map((item: IBreadcrumb) =>
                    item.isLast ? (
                      <BreadcrumbItem key={item.path}>
                        <BreadcrumbPage>{item.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    ) : (
                      <React.Fragment key={item.path}>
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link to={item.path}>{item.name}</Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                      </React.Fragment>
                    )
                  )}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <StoreSelector />
            <ToggleTheme />
          </div>
        </header>

        <main className="w-full min-h-0 flex-1 p-4 md:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
