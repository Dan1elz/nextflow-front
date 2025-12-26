import { createContext } from "react";

import type { IUser, ILogin } from "@/interfaces/user.interface";

export type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  user: IUser | null;
  loading: boolean;
  login: (data: ILogin) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
