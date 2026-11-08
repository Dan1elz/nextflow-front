import type {
  StockTransferDto,
  StockTransferRequestDto,
} from "@/interfaces/stock-transfer.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

/** Transferência de estoque entre locais (RN-CE62). Sem editar nem excluir: corrigir é transferir de volta. */
export const stockTransferService = {
  create(
    dto: StockTransferRequestDto,
    token?: string
  ): Promise<StockTransferDto> {
    return apiService.post<StockTransferDto>("stock-transfers", dto, token);
  },

  getById(id: string, token?: string): Promise<StockTransferDto> {
    return apiService.get<StockTransferDto>(
      `stock-transfers/${id}`,
      undefined,
      token
    );
  },
};
