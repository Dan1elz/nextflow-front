import { createContext } from "react";
import type { IDashboardStats } from "@/interfaces/dashboard.interface";

export type DashboardContextType = {
  stats: IDashboardStats | null;
  loading: boolean;
  fetchStats: () => Promise<void>;
};

export const DashboardContext = createContext<DashboardContextType | null>(null);
