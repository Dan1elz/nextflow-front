export interface IUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  cpf: string;
  birthDate: string;
  isActive?: boolean;
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
