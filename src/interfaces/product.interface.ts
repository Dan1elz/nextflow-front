import type { Option } from "@/interfaces/api.interface";
import type { CategoryOptionDto } from "@/interfaces/category.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import type { PromotionSummaryDto } from "@/interfaces/promotion.interface";
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
  /** Mínimo em todo local sem mínimo próprio (RN-CE33). */
  defaultMinQuantity: number;
  /** Exceção à política da classe ABC (RN-CE29); vazio usa a da classe. */
  targetCoverageDays?: number | null;
  locationMinimums: ProductLocationMinimumDto[];
}

/** Mínimo de uma variação num local (RN-CE33). A variação é citada pela posição em `variants`, porque a nova não tem id. */
export interface ProductLocationMinimumDto {
  variantIndex: number;
  locationId: string;
  minQuantity: number;
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
  /** Colunas da tabela de mínimos: locais ativos de lojas ativas e os que já têm mínimo. */
  locations: LocationOptionDto[];
}

/** `GET /products/form` (criação) e `GET /products/{id}/form` (edição). */
export interface ProductFormDto extends ProductRequestDto {
  id?: string | null;
  imageUrl?: string | null;
  options: ProductFormOptionsDto;
}

/**
 * `availableQuantity` é o físico na loja de `filters.storeId` (ou na empresa). `hasLowStock`: alguma variação abaixo do
 * mínimo efetivo em algum local do mesmo recorte (RN-CE33). `activePromotionPercent`: maior desconto vigente entre as variações (F2.3).
 */
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

/** Disponível é o físico da empresa; custo médio é a faixa entre as variações com custo; `activePromotionPercent` é o maior desconto vigente (F2.3). */
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
  activePromotion?: PromotionSummaryDto | null;
  averageCost?: number | null;
  lastCost?: number | null;
  marginPercent?: number | null;
  availableQuantity: number;
  isActive: boolean;
}

export interface ProductImageResponseDto {
  imageUrl?: string | null;
}

/** Aba Fornecedores do T3. `leadTimeDays` é o efetivo; `lastCost` vem do último recebimento; `lastPurchaseOn` segue nulo. */
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

/** Aba Estoque do T3. Reservado é 0 e disponível = físico até haver orçamento (RN-CE08); `minQuantity` é o mínimo efetivo (RN-CE33). */
export interface StockMatrixCellDto {
  locationId: string;
  physical: number;
  reserved: number;
  available: number;
  minQuantity: number;
  isBelowMin: boolean;
}

export interface StockMatrixRowDto {
  variantId: string;
  variantLabel: string;
  sku: string;
  cells: StockMatrixCellDto[];
}

export interface StockMatrixLocationDto {
  id: string;
  name: string;
  storeName: string;
}

export interface StockMatrixDto {
  locations: StockMatrixLocationDto[];
  rows: StockMatrixRowDto[];
}
