import type {
  StockPolicyDto,
  StockPolicyRequestDto,
} from "@/interfaces/stock-policy.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

/** Política de estoque por classe ABC (T13). As três linhas vêm do seed: só se edita cobertura e segurança. */
export const stockPolicyService = {
  getAll(token?: string): Promise<StockPolicyDto[]> {
    return apiService.get<StockPolicyDto[]>("stock-policies", undefined, token);
  },

  update(
    id: string,
    dto: StockPolicyRequestDto,
    token?: string
  ): Promise<StockPolicyDto> {
    return apiService.put<StockPolicyDto>(`stock-policies/${id}`, dto, token);
  },
};
