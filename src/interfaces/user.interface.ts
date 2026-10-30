import type { TRoleEnum } from "@/types/enums";

/** DTOs do módulo Acesso (`nextflow-docs/docs/architecture/modules/access/contract.md`). */

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface CurrentUserStoreDto {
  id: string;
  name: string;
}

export interface CurrentUserDto {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: TRoleEnum;
  stores: CurrentUserStoreDto[];
}

export interface LoginResponseDto {
  token: string;
  expiresAt: string;
  user: CurrentUserDto;
}

export interface UpdateProfileRequestDto {
  name: string;
  lastName: string;
  email: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserListItemDto {
  id: string;
  fullName: string;
  email: string;
  cpfMasked: string;
  role: TRoleEnum;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface UserRequestDto {
  name: string;
  lastName: string;
  cpf: string;
  birthDate: string;
  email: string;
  password: string;
}

export interface UpdateUserRequestDto {
  name: string;
  lastName: string;
  birthDate: string;
  email: string;
  newPassword?: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  lastName: string;
  cpf: string;
  birthDate: string;
  email: string;
  role: TRoleEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
}

/** Combo de usuário nas telas ainda não migradas (Pedidos, Movimentações). */
export type UserOption = Pick<UserListItemDto, "id" | "fullName">;
