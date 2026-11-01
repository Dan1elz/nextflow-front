import type {
  ProductFormDto,
  ProductRequestDto,
} from "@/interfaces/product.interface";
import { parsePrice, type ProductFormData } from "@/schemas/product.schema";
import { formatCurrency } from "@/utils/format.helpers";
import { TProductType, TSaleUnit } from "@/types/enums";

type FormAttribute = ProductFormData["attributes"][number];
type FormVariant = ProductFormData["variants"][number];

let tempKeySequence = 0;

/** Chave do valor ainda sem id (L1). */
export const newTempKey = () => `novo-${++tempKeySequence}`;

/** Casas decimais sugeridas ao escolher a unidade (T2): o usuário pode ajustar. */
export const DECIMALS_BY_UNIT: Record<TSaleUnit, string> = {
  Unit: "0",
  Kilogram: "3",
  Liter: "3",
  Meter: "2",
};

export const emptyVariant = (): FormVariant => ({
  id: null,
  attributeValueIds: [],
  sku: "",
  barcode: "",
  price: "",
  isActive: true,
});

/** Formulário em branco da criação: tipo Padrão, sem grade, com a variação oculta (RN-CE48). */
export const emptyProductForm = (): ProductFormData => ({
  name: "",
  brand: "",
  description: "",
  productType: TProductType.Standard,
  categoryIds: [],
  saleUnit: TSaleUnit.Unit,
  decimalPlaces: DECIMALS_BY_UNIT.Unit,
  allowsNegative: false,
  tracksLots: false,
  shelfLifeDays: "",
  collectionId: "",
  launchedOn: "",
  hasGrid: false,
  attributes: [],
  variants: [emptyVariant()],
  eventIds: [],
  suppliers: [],
});

export const toFormValues = (dto: ProductFormDto): ProductFormData => ({
  name: dto.name,
  brand: dto.brand ?? "",
  description: dto.description ?? "",
  productType: dto.productType,
  categoryIds: dto.categoryIds,
  saleUnit: dto.saleUnit,
  decimalPlaces: String(dto.decimalPlaces),
  allowsNegative: dto.allowsNegative,
  tracksLots: dto.tracksLots,
  shelfLifeDays: dto.shelfLifeDays == null ? "" : String(dto.shelfLifeDays),
  collectionId: dto.collectionId ?? "",
  launchedOn: dto.launchedOn ?? "",
  hasGrid: dto.attributes.length > 0,
  attributes: dto.attributes.map((attribute) => ({
    id: attribute.id ?? null,
    name: attribute.name,
    values: attribute.values.map((value) => ({
      key: value.id ?? "",
      isNew: false,
      value: value.value,
    })),
  })),
  variants: dto.variants.map((variant) => ({
    id: variant.id ?? null,
    attributeValueIds: variant.attributeValueIds,
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    price: variant.price.toFixed(2).replace(".", ","),
    isActive: variant.isActive,
  })),
  eventIds: dto.eventIds,
  suppliers: dto.suppliers.map((supplier) => ({
    supplierId: supplier.supplierId,
    isPreferred: supplier.isPreferred,
    supplierSku: supplier.supplierSku ?? "",
    leadTimeDays:
      supplier.leadTimeDays == null ? "" : String(supplier.leadTimeDays),
    minOrderQty:
      supplier.minOrderQty == null ? "" : String(supplier.minOrderQty),
    orderMultiple:
      supplier.orderMultiple == null ? "" : String(supplier.orderMultiple),
  })),
});

export const toRequestDto = (data: ProductFormData): ProductRequestDto => ({
  name: data.name,
  brand: data.brand.trim() || null,
  description: data.description.trim() || null,
  productType: data.productType,
  categoryIds: data.categoryIds,
  saleUnit: data.saleUnit,
  decimalPlaces: Number(data.decimalPlaces),
  allowsNegative: data.allowsNegative,
  tracksLots: data.tracksLots,
  shelfLifeDays: data.tracksLots ? Number(data.shelfLifeDays) : null,
  collectionId: data.collectionId || null,
  launchedOn: data.launchedOn || null,
  attributes: data.hasGrid
    ? data.attributes.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        values: attribute.values.map((value) =>
          value.isNew
            ? { tempKey: value.key, value: value.value }
            : { id: value.key, value: value.value }
        ),
      }))
    : [],
  variants: data.variants.map((variant) => ({
    id: variant.id,
    attributeValueIds: data.hasGrid ? variant.attributeValueIds : [],
    sku: variant.sku,
    barcode: variant.barcode.trim() || null,
    price: parsePrice(variant.price),
    isActive: data.hasGrid ? variant.isActive : true,
  })),
  eventIds: data.eventIds,
  suppliers: data.suppliers.map((supplier) => ({
    supplierId: supplier.supplierId,
    isPreferred: supplier.isPreferred,
    supplierSku: supplier.supplierSku.trim() || null,
    leadTimeDays: supplier.leadTimeDays.trim()
      ? Number(supplier.leadTimeDays)
      : null,
    minOrderQty: supplier.minOrderQty.trim()
      ? Number(supplier.minOrderQty)
      : null,
    orderMultiple: supplier.orderMultiple.trim()
      ? Number(supplier.orderMultiple)
      : null,
  })),
});

const skuPart = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();

/** "P / Azul" a partir das chaves, na ordem da grade. */
export const combinationLabel = (attributes: FormAttribute[], keys: string[]) =>
  attributes
    .map(
      (attribute) =>
        attribute.values.find((value) => keys.includes(value.key))?.value
    )
    .filter(Boolean)
    .join(" / ");

/**
 * Botão "gerar combinações" (T2): produto cartesiano dos valores. Linha que já existe é mantida: primeiro a de combinação
 * igual, depois a que cabe na combinação (ex.: a variação oculta ou "P" quando surge o atributo Cor) e, por fim, a que
 * contém a combinação ("P / Azul" quando o atributo Cor sai), para o id não se perder quando houver saldo (RN-CE51). SKU
 * novo é só uma sugestão editável.
 */
export const generateCombinations = (
  attributes: FormAttribute[],
  current: FormVariant[],
  productName: string
): FormVariant[] => {
  const combinations = attributes.reduce<string[][]>(
    (rows, attribute) =>
      rows.flatMap((row) =>
        attribute.values.map((value) => [...row, value.key])
      ),
    [[]]
  );

  const available = [...current];
  const take = (matches: (variant: FormVariant) => boolean) => {
    const index = available.findIndex(matches);
    return index < 0 ? undefined : available.splice(index, 1)[0];
  };

  const exact = combinations.map((keys) =>
    take(
      (variant) =>
        variant.attributeValueIds.length === keys.length &&
        variant.attributeValueIds.every((key) => keys.includes(key))
    )
  );
  const defaultPrice = current.find((variant) => variant.price)?.price ?? "";

  return combinations.map((keys, index) => {
    // Sem nome não há sugestão: "P" sozinho colidiria no próximo produto, e o botão preenche depois (RN-CE57).
    const name = skuPart(productName);
    const suggestedSku = name
      ? [name, skuPart(combinationLabel(attributes, keys))]
          .filter(Boolean)
          .join("-")
      : "";
    const kept =
      exact[index] ??
      take((variant) =>
        variant.attributeValueIds.every((key) => keys.includes(key))
      ) ??
      take((variant) =>
        keys.every((key) => variant.attributeValueIds.includes(key))
      );
    if (kept) {
      return {
        ...kept,
        attributeValueIds: keys,
        sku: kept.sku || suggestedSku,
      };
    }

    return {
      ...emptyVariant(),
      attributeValueIds: keys,
      price: defaultPrice,
      sku: suggestedSku,
    };
  });
};

export const formatPriceRange = (min: number, max: number) =>
  min === max
    ? formatCurrency(min)
    : `${formatCurrency(min)} a ${formatCurrency(max)}`;
