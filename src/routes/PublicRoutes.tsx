import { useAuth } from "@/hooks/use-auth";
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

export function PublicRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
