import { useCallback, useEffect, useState, type ReactNode } from "react";

import type {
  ChangePasswordRequestDto,
  CurrentUserDto,
  LoginRequestDto,
  UpdateProfileRequestDto,
} from "@/interfaces/user.interface";
import { authService } from "@/services/auth.service";
import { AuthContext, type AuthContextType } from "@/contexts/auth.context";
import { onUnauthorized } from "@/services/api.service";
import { Spinner } from "@/components/ui/spinner";
import { handleError } from "@/utils/toast.helpers";

const TOKEN_STORAGE_KEY = "user-auth-token";

/** Lida pela tela de login para explicar por que a sessão acabou. */
export const SESSION_MESSAGE_KEY = "auth-error-message";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem(TOKEN_STORAGE_KEY)
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  // Token vencido (L-AC4) ou usuário inativado (RN-AC02): qualquer 401 encerra a sessão.
  useEffect(() => {
    onUnauthorized(() => {
      sessionStorage.setItem(
        SESSION_MESSAGE_KEY,
        "Sessão expirada. Por favor, faça login novamente."
      );
      logout();
    });
    return () => onUnauthorized(undefined);
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) return;

    authService
      .me(storedToken)
      .then(setUser)
      .catch((error) => handleError(error))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (dto: LoginRequestDto) => {
    const response = await authService.login(dto);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const updateProfile = useCallback(
    async (dto: UpdateProfileRequestDto) => {
      setUser(await authService.updateProfile(dto, token ?? undefined));
    },
    [token]
  );

  const changePassword = useCallback(
    async (dto: ChangePasswordRequestDto) => {
      await authService.changePassword(dto, token ?? undefined);
    },
    [token]
  );

  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Spinner className="size-8 text-primary" />
      </div>
    );

  const value: AuthContextType = {
    isAuthenticated: !!token,
    token,
    user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
