import type { IApiResponse } from "@/interfaces/api.interface";
import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type {
  IUser,
  IRecoverPasswordRequest,
  IResetPasswordRequest,
} from "@/interfaces/user.interface";

const baseService = new BaseService<IUser>("users");
const apiService = new ApiService();

export const userService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  create: baseService.create.bind(baseService),
  update: baseService.update.bind(baseService),
  recoverPassword: async (
    data: IRecoverPasswordRequest
  ): Promise<IApiResponse<void>> => {
    const response = await apiService.post<void>(
      "users/recover-password",
      data
    );
    return response;
  },
  resetPassword: async (
    data: IResetPasswordRequest
  ): Promise<IApiResponse<void>> => {
    const response = await apiService.post<void>("users/reset-password", data);
    return response;
  },
};
