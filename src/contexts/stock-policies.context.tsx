import { createContext } from "react";

import type {
  StockPolicyDto,
  StockPolicyRequestDto,
} from "@/interfaces/stock-policy.interface";

export type StockPoliciesContextType = {
  policies: StockPolicyDto[];
  loading: boolean;
  loadPolicies: () => Promise<void>;
  updatePolicy: (id: string, dto: StockPolicyRequestDto) => Promise<void>;
};

export const StockPoliciesContext =
  createContext<StockPoliciesContextType | null>(null);
