import type { Option } from "@/interfaces/api.interface";
import type { CategoryOptionDto } from "@/interfaces/category.interface";
import type { TLifecycle, TProductType, TSaleUnit } from "@/types/enums";

export interface ProductAttributeValueRequestDto {
  id?: string | null;
  /** Valor novo: a variação cita esta chave em `attributeValueIds` (L1, RN-CE50). */
  tempKey?: string | null;
  value: string;
}

export interface ProductAttributeRequestDto {
  id?: string | null;
  name: string;
  values: ProductAttributeValueRequestDto[];
}

export interface ProductVariantRequestDto {
  id?: string | null;
  /** Ids de valores existentes ou `tempKey` de valores novos. */
  attributeValueIds: string[];
  sku: string;
  barcode?: string | null;
  price: number;
  isActive: boolean;
}

export interface ProductRequestDto {
  name: string;
  brand?: string | null;
  description?: string | null;
  productType: TProductType;
  categoryIds: string[];
  saleUnit: TSaleUnit;
  decimalPlaces: number;
  allowsNegative: boolean;
  tracksLots: boolean;
  shelfLifeDays?: number | null;
  collectionId?: string | null;
  launchedOn?: string | null;
  attributes: ProductAttributeRequestDto[];
  variants: ProductVariantRequestDto[];
}

export interface ProductFormOptionsDto {
  categories: CategoryOptionDto[];
  collections: Option[];
}

/** `GET /products/form` (criação) e `GET /products/{id}/form` (edição). */
export interface ProductFormDto extends ProductRequestDto {
  id?: string | null;
  imageUrl?: string | null;
  options: ProductFormOptionsDto;
}

/** `availableQuantity`, `hasLowStock` e `activePromotionPercent` são provisórios até a F1.5 e a F2.3 (contrato T1). */
export interface ProductListItemDto {
  id: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  productType: TProductType;
  lifecycle: TLifecycle;
  isActive: boolean;
  categoryPath?: string | null;
  hasVariants: boolean;
  variantCount: number;
  minEffectivePrice: number;
  maxEffectivePrice: number;
  activePromotionPercent?: number | null;
  availableQuantity: number;
  saleUnit: TSaleUnit;
  decimalPlaces: number;
  hasLowStock: boolean;
}

/** Custo, disponível e promoção são provisórios até a F1.5 e a F2.3 (contrato T3). */
export interface ProductResponseDto {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  productType: TProductType;
  lifecycle: TLifecycle;
  isActive: boolean;
  launchedOn?: string | null;
  categories: CategoryOptionDto[];
  collection?: Option | null;
  saleUnit: TSaleUnit;
  decimalPlaces: number;
  allowsNegative: boolean;
  tracksLots: boolean;
  shelfLifeDays?: number | null;
  hasVariants: boolean;
  minAverageCost?: number | null;
  maxAverageCost?: number | null;
  minEffectivePrice: number;
  maxEffectivePrice: number;
  activePromotionPercent?: number | null;
  availableQuantity: number;
  variantCount: number;
}

/** `label` é "P / Azul" e vem vazio na variação padrão oculta. */
export interface ProductVariantResponseDto {
  id: string;
  label: string;
  sku: string;
  barcode?: string | null;
  price: number;
  effectivePrice: number;
  averageCost?: number | null;
  lastCost?: number | null;
  marginPercent?: number | null;
  availableQuantity: number;
  isActive: boolean;
}

export interface ProductImageResponseDto {
  imageUrl?: string | null;
}
