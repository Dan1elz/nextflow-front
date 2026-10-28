import type { TRoleEnum } from "@/types/enums";

export interface IUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  cpf: string;
  birthDate: string;
  isActive?: boolean;
  /** Papel do usuário (enviado no login/check-auth). */
  role?: TRoleEnum;
}

export interface ICreateUser {
  name: string;
  lastName: string;
  email: string;
  cpf: string;
  birthDate: string;
  password: string;
}

export interface IUpdateUser {
  name: string;
  lastName: string;
  email: string;
  cpf: string;
  birthDate: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  userId: string;
  user: IUser;
}

export interface IRecoverPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}
