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
    let breadcrumbPath = "";

    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1;

      const isNumericId = /^\d+$/.test(segment);
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        );

      if (isNumericId || isUuid) {
        return;
      }

      breadcrumbPath += `/${segment}`;

      const name =
        routeNameMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      items.push({
        name,
        path: breadcrumbPath,
        isLast,
      });
    });

    return items.length > 0 ? items : null;
  }, [location.pathname]);

  return breadcrumbs;
}
