import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type {
  ICreatePromotion,
  IPromotion,
} from "@/interfaces/promotion.interface";

const baseService = new BaseService<IPromotion>("promotions");
const apiService = new ApiService();

export const promotionService = {
  /** GET /api/promotions — filtros: productId, status (active|scheduled|ended|canceled), source */
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),

  /** POST /api/promotions (Admin) */
  async create(data: ICreatePromotion, token?: string): Promise<IPromotion> {
    const response = await apiService.post<IPromotion>(
      "promotions",
      data,
      token
    );
    return response.data;
  },

  /** DELETE /api/promotions/{id} (Admin) — cancela a promoção (IsActive = false) */
  async cancel(id: string, token?: string): Promise<void> {
    await apiService.delete(`promotions/${id}`, token);
  },
};
