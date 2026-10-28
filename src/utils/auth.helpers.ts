import type { IUser } from "@/interfaces/user.interface";
import { TRoleEnum } from "@/types/enums";

/**
 * Indica se o usuário é Administrador.
 * O backend envia `role` como número (RoleEnum); por segurança também aceita o nome ("Admin").
 * Usado apenas para esconder ações na UI — a autorização real é feita pela API (403).
 */
export function isAdmin(user?: IUser | null): boolean {
  if (!user || user.role === undefined || user.role === null) return false;
  const role: unknown = user.role;
  if (typeof role === "string") {
    return role.toLowerCase() === "admin" || Number(role) === TRoleEnum.Admin;
  }
  return role === TRoleEnum.Admin;
}
