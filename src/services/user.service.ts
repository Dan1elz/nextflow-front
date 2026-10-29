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
  recoverPassword: async (data: IRecoverPasswordRequest): Promise<void> => {
    const response = await apiService.post<void>(
      "users/recover-password",
      data
    );
    return response;
  },
  resetPassword: async (data: IResetPasswordRequest): Promise<void> => {
    const response = await apiService.post<void>("users/reset-password", data);
    return response;
  },
  reactivate: async (id: string, token?: string): Promise<void> => {
    const response = await apiService.patch<void>(
      `users/reactivate/${id}`,
      {},
      token
    );
    return response;
  },
};
