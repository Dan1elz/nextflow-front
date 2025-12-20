export interface IUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  cpf: string;
}

export interface IUserForm extends IUser {
  password?: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  userId: string;
}

export interface IRecoverPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}
