import { useState, useCallback, type ReactNode, useEffect } from "react";

import type {
  IUser,
  ILogin,
  ILoginResponse,
} from "@/interfaces/user.interface";
import { authService } from "@/services/auth.service";
import { AuthContext, type AuthContextType } from "@/contexts/auth.context";

export function AuthProvider({
  children,
  tokenStorageKey = "user-auth-token",
  userStorageKey = "user",
}: {
  children: ReactNode;
  tokenStorageKey?: string;
  userStorageKey?: string;
}) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(tokenStorageKey)
  );
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);

  const handleLoginResponse = useCallback(
    (response: ILoginResponse) => {
      setToken(response.token);
      localStorage.setItem(tokenStorageKey, response.token);

      if (response.user) {
        setUser(response.user);
        localStorage.setItem(userStorageKey, JSON.stringify(response.user));
      }
    },
    [tokenStorageKey, userStorageKey]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(userStorageKey);
  }, [tokenStorageKey, userStorageKey]);

  const checkAuth = useCallback(async () => {
    const currentToken = localStorage.getItem(tokenStorageKey);
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.checkAuth(currentToken);
      handleLoginResponse(response);
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [tokenStorageKey, handleLoginResponse, logout]);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem(tokenStorageKey);
      const storedUser = JSON.parse(
        localStorage.getItem(userStorageKey) || "null"
      ) as IUser | null;

      setToken(storedToken);
      setUser(storedUser);

      if (storedToken) {
        checkAuth();
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [tokenStorageKey, userStorageKey, checkAuth]);

  const login = useCallback(
    async (data: ILogin) => {
      const response = await authService.login(data);
      handleLoginResponse(response);
    },
    [handleLoginResponse]
  );

  if (loading) return <div>Carregando...</div>;

  const value: AuthContextType = {
    isAuthenticated: !!token,
    token,
    user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
