import { createContext } from "react";

import type {
  IUser,
  ICreateUser,
  IUpdateUser,
  IRecoverPasswordRequest,
  IResetPasswordRequest,
} from "@/interfaces/user.interface";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";

export type UsersContextType = {
  users: IUser[];
  selectedUser: IUser | null;
  pagination: IPaginationInfo | null;
  searchUsers: (query?: IIndexParams) => Promise<void>;
  selectUser: (id: string) => Promise<void>;
  createUser: (user: ICreateUser) => Promise<IUser>;
  updateUser: (id: string, user: IUpdateUser) => Promise<IUser>;
  deleteUser: (id: string) => Promise<void>;
  recoverPassword: (data: IRecoverPasswordRequest) => Promise<void>;
  resetPassword: (data: IResetPasswordRequest) => Promise<void>;
};

export const UsersContext = createContext<UsersContextType | null>(null);
