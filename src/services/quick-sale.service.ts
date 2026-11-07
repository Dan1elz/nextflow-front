import type {
  OrderDetailDto,
  QuickSaleDto,
  QuickSalePreviewDto,
} from "@/interfaces/quick-sale.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

/** Venda rápida de balcão (T-VD2): concluir e a prévia do rodapé. */
export const quickSaleService = {
  create(dto: QuickSaleDto, token?: string): Promise<OrderDetailDto> {
    return apiService.post<OrderDetailDto>("sales/quick", dto, token);
  },

  /** `signal` cancela a prévia anterior quando o carrinho muda de novo antes da resposta. */
  preview(
    dto: QuickSaleDto,
    token?: string,
    signal?: AbortSignal
  ): Promise<QuickSalePreviewDto> {
    return apiService.post<QuickSalePreviewDto>(
      "sales/quick/preview",
      dto,
      token,
      false,
      signal
    );
  },
};
