import { useAuth } from "@/hooks/use-auth";
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

export function PrivateRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div></div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
