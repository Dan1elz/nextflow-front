export interface ISupplier {
  id?: string;
  name: string;
  cnpj: string;
  isActive: boolean;
  /** Prazo de entrega padrão em dias (1–180, default 7). */
  leadTimeDays?: number;
}
