import { TRoleEnum } from "@/types/enums";

/**
 * Indica se o usuário é Administrador (o `role` chega como string, pelo `GetApiName()` da API).
 * Usado apenas para esconder ações na UI — a autorização real é feita pela API (403).
 */
export function isAdmin(user?: { role?: TRoleEnum | null } | null): boolean {
  return user?.role === TRoleEnum.Admin;
}
