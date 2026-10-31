/** Legado: telas antigas de produto e pedido de compra, até a F1.3. */
export interface ICategory {
  id?: string;
  description: string;
}

export interface CategoryRequestDto {
  name: string;
  description?: string | null;
  /** Nulo = nível 1. Só categoria de nível 1 pode ser pai (RN-CE23). */
  parentId?: string | null;
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
}

/** `productCount` fica zero até a F1.3. */
export interface CategoryNodeDto extends CategoryResponseDto {
  productCount: number;
  children: CategoryNodeDto[];
}

export interface CategoryOptionDto {
  id: string;
  name: string;
  parentId?: string | null;
  /** "Pai > Filha" na subcategoria. */
  path: string;
}
