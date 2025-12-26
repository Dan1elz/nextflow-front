import { useAuth } from "@/hooks/use-auth";
import { type ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/services/auth.service";

export function PrivateRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        await authService.checkAuth(token);
      } catch {
        if (active) logout();
      } finally {
        if (active) setLoading(false);
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [token, logout]);

  if (loading) return <div></div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
