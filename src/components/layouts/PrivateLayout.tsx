import { Outlet, Link } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbPath } from "@/hooks/useBreadcrumbPath";
import type { IBreadcrumb } from "@/types/general";
import React from "react";
import { ToggleTheme } from "./ToggleTheme";

export default function PrivateLayout() {
  const breadcrumbItemsData = useBreadcrumbPath();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex p-4 items-center">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-4 h-6" />
          <Breadcrumb>
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
          <div className="ml-auto">
            <ToggleTheme />
          </div>
        </header>

        <main className="flex-1 w-full min-h-0 p-3">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
