import type { TUnitType } from "@/types/general";
import type { ISupplier } from "./supplier.interface";

/**
 * Categoria retornada pela API (GET).
 * Alinhado com CategoryResponseDto do backend.
 */
export interface ICategory {
  id: string;
  description: string;
}

/**
 * Interface unificada de produto para o frontend.
 *
 * - GET (resposta da API): image é URL (string), categories é a lista de categorias.
 * - POST/PUT (envio): image é File quando há upload, categoryIds é a lista de IDs (Guid) esperada pelo backend.
 *
 * Backend: CreateProductDto/UpdateProductDto (CategoryIds, Image como IFormFile no request);
 * ProductResponseDto (Image como string, Categories como List<CategoryResponseDto>).
 */
export interface IProduct {
  id?: string;
  supplierId: string;
  supplier?: ISupplier;
  productCode: string;
  name: string;
  description: string;
  /**
   * GET: URL da imagem retornada pela API.
   * POST/PUT: arquivo (File) quando o usuário envia imagem; null quando não há imagem.
   */
  image?: string | File | null;
  /**
   * POST/PUT: lista de IDs de categorias enviada ao backend (Guid).
   * O backend espera List<Guid> em CategoryIds.
   */
  categoryIds?: string[];
  /**
   * GET: lista de categorias retornada pela API (ProductResponseDto.Categories).
   */
  categories?: ICategory[];
  quantity: number | string;
  unitType: TUnitType;
  price: number | string;
  /** DateOnly no backend: formato "YYYY-MM-DD". */
  validity?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
