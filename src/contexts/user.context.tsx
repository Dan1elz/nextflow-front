import { createContext } from "react";

import type {
  IUser,
  ICreateUser,
  IUpdateUser,
  IRecoverPasswordRequest,
  IResetPasswordRequest,
} from "@/interfaces/user.interface";
import type { IPagination } from "@/interfaces/api.interface";

export type UserContextType = {
  users: IUser[];
  selectedUser: IUser | null;
  pagination: IPagination | null;
  searchUsers: (query?: IPagination) => Promise<void>;
  selectUser: (id: string) => Promise<void>;
  createUser: (user: ICreateUser) => Promise<IUser>;
  updateUser: (id: string, user: IUpdateUser) => Promise<IUser>;
  deleteUser: (id: string) => Promise<void>;
  recoverPassword: (data: IRecoverPasswordRequest) => Promise<void>;
  resetPassword: (data: IResetPasswordRequest) => Promise<void>;
};

export const UserContext = createContext<UserContextType | null>(null);
