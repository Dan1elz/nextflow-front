import type { ManualMovementDto } from "@/interfaces/manual-movement.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

/** Lançamento manual de estoque (T9). Sem editar nem excluir: correção é um lançamento contrário (RN-CE14). */
export const manualMovementService = {
  create(dto: ManualMovementDto, token?: string): Promise<void> {
    return apiService.post<void>("stock-movements/manual", dto, token);
  },
};
