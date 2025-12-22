import type { ILogin, ILoginResponse } from "@/interfaces/user.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

export const authService = {
  login: async (form: ILogin): Promise<ILoginResponse> => {
    const response = await apiService.post<ILoginResponse>("users/login", form);
    return response.data;
  },

  checkAuth: async (token: string): Promise<ILoginResponse> => {
    const response = await apiService.get<ILoginResponse>("users/check-auth", {
      token,
    });
    return response.data;
  },
};
