import type {
  ChangePasswordRequestDto,
  CurrentUserDto,
  LoginRequestDto,
  LoginResponseDto,
  UpdateProfileRequestDto,
} from "@/interfaces/user.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

export const authService = {
  login: (dto: LoginRequestDto) =>
    apiService.post<LoginResponseDto>("auth/login", dto),

  me: (token: string) =>
    apiService.get<CurrentUserDto>("auth/me", undefined, token),

  updateProfile: (dto: UpdateProfileRequestDto, token?: string) =>
    apiService.put<CurrentUserDto>("auth/me", dto, token),

  changePassword: (dto: ChangePasswordRequestDto, token?: string) =>
    apiService.post<void>("auth/change-password", dto, token),
};
