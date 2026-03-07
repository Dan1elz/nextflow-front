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
  searchUsersForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: IUser[]; totalItems: number }>;
  selectUser: (id: string) => Promise<void>;
  getUserById: (id: string) => Promise<IUser>;
  createUser: (user: ICreateUser) => Promise<IUser>;
  updateUser: (id: string, user: IUpdateUser) => Promise<IUser>;
  deleteUser: (id: string) => Promise<void>;
  reactivateUser: (id: string) => Promise<void>;
  recoverPassword: (data: IRecoverPasswordRequest) => Promise<void>;
  resetPassword: (data: IResetPasswordRequest) => Promise<void>;
};

export const UsersContext = createContext<UsersContextType | null>(null);
