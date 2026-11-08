import { setupServer } from "msw/node";

import { API_URL } from "@/configs/api";

/** Servidor MSW dos testes: cada teste registra os handlers com `server.use(...)`. */
export const server = setupServer();

/** URL completa de uma rota da API (`apiUrl("dashboard/sales-kpis")`). */
export function apiUrl(path: string): string {
  return `${API_URL}/api/${path}`;
}
