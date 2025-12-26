import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import type { IBreadcrumb } from "@/types/general";

const routeNameMap: Record<string, string> = {
  users: "Usuários",
  create: "Criar",
  edit: "Editar",
};

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
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      if (/^\d+$/.test(segment)) {
        if (items.length > 0) {
          const previousItem = items[items.length - 1];
          if (previousItem) {
            previousItem.path = currentPath;
            previousItem.isLast = isLast;
          }
        }
        return;
      }

      const name =
        routeNameMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      items.push({
        name,
        path: currentPath,
        isLast,
      });
    });

    return items.length > 0 ? items : null;
  }, [location.pathname]);

  return breadcrumbs;
}
