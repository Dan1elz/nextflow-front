import { ApiService } from "./api.service";
import type { IDashboardStats } from "@/interfaces/dashboard.interface";

const apiService = new ApiService();

export const dashboardService = {
  getStats: async (token?: string): Promise<IDashboardStats> => {
    const response = await apiService.get<IDashboardStats>("dashboard/stats", undefined, token);
    return response.data;
  },
};
