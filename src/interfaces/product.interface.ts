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

/** Linha da tabela Fornecedores do T2. O vínculo é reconhecido por `supplierId`, único no produto (RN-CE27). */
export interface ProductSupplierRequestDto {
  supplierId: string;
  isPreferred: boolean;
  supplierSku?: string | null;
  /** Vazio usa o prazo do fornecedor. */
  leadTimeDays?: number | null;
  minOrderQty?: number | null;
  orderMultiple?: number | null;
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
  eventIds: string[];
  suppliers: ProductSupplierRequestDto[];
}

/** Fornecedor no formulário: `leadTimeDays` é o padrão do campo vazio; `isActive` marca o inativo já vinculado. */
export interface SupplierOptionDto {
  id: string;
  name: string;
  leadTimeDays: number;
  isActive: boolean;
}

export interface ProductFormOptionsDto {
  categories: CategoryOptionDto[];
  collections: Option[];
  events: Option[];
  suppliers: SupplierOptionDto[];
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
  events: Option[];
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

/** Aba Fornecedores do T3. `leadTimeDays` é o efetivo; `lastCost` e `lastPurchaseOn` ficam nulos até a F2.8. */
export interface ProductSupplierResponseDto {
  supplierId: string;
  supplierName: string;
  supplierIsActive: boolean;
  isPreferred: boolean;
  supplierSku?: string | null;
  leadTimeDays: number;
  minOrderQty?: number | null;
  orderMultiple?: number | null;
  lastCost?: number | null;
  lastPurchaseOn?: string | null;
}

/** Aba Preços do T3. `variantLabel` vem vazio na variação oculta; `variantRemoved` marca a que saiu do formulário. */
export interface PriceHistoryResponseDto {
  id: string;
  variantLabel: string;
  sku: string;
  variantRemoved: boolean;
  price: number;
  validFrom: string;
  validTo?: string | null;
  changedByName: string;
}
