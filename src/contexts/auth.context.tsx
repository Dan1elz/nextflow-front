import { createContext } from "react";

import type {
  ChangePasswordRequestDto,
  CurrentUserDto,
  LoginRequestDto,
  UpdateProfileRequestDto,
} from "@/interfaces/user.interface";

export type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  user: CurrentUserDto | null;
  loading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => void;
  updateProfile: (dto: UpdateProfileRequestDto) => Promise<void>;
  changePassword: (dto: ChangePasswordRequestDto) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
