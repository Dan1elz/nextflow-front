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

  preview(dto: QuickSaleDto, token?: string): Promise<QuickSalePreviewDto> {
    return apiService.post<QuickSalePreviewDto>(
      "sales/quick/preview",
      dto,
      token
    );
  },
};
