import { z } from "zod";

import { TProductType, TSaleUnit } from "@/types/enums";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const productTypes = Object.values(TProductType) as [
  TProductType,
  ...TProductType[],
];
const saleUnits = Object.values(TSaleUnit) as [TSaleUnit, ...TSaleUnit[]];

/** Aceita vírgula ou ponto como decimal; com vírgula, ponto é separador de milhar ("1.234,56"). */
export const parsePrice = (value: string) => {
  const text = value.trim();
  return Number(
    text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text
  );
};

const repeatedIndexes = (items: string[]) => {
  const seen = new Set<string>();
  return items.flatMap((item, index) => {
    const key = item.trim().toLowerCase();
    if (!key) return [];
    if (seen.has(key)) return [index];
    seen.add(key);
    return [];
  });
};

const valueSchema = z.object({
  /** `id` do valor gravado ou `tempKey` do valor novo: é o que a variação cita (L1). */
  key: z.string(),
  isNew: z.boolean(),
  value: z.string(),
});

const attributeSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  values: z.array(valueSchema),
});

const variantSchema = z.object({
  id: z.string().nullable(),
  attributeValueIds: z.array(z.string()),
  sku: z.string(),
  barcode: z.string(),
  price: z.string(),
  isActive: z.boolean(),
});

const supplierSchema = z.object({
  supplierId: z.string(),
  isPreferred: z.boolean(),
  supplierSku: z.string(),
  leadTimeDays: z.string(),
  minOrderQty: z.string(),
  orderMultiple: z.string(),
});

const isPositiveInteger = (value: string) => {
  const number = Number(value.trim());
  return Number.isInteger(number) && number > 0;
};

/** Espelha o `ProductRequestDtoValidator` da API (contrato T2, RN-CE48, RN-CE49, RN-CE54, RN-CE56). */
export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(150, "O nome deve ter no máximo 150 caracteres."),
    brand: z.string().max(100, "A marca deve ter no máximo 100 caracteres."),
    description: z
      .string()
      .max(1000, "A descrição deve ter no máximo 1000 caracteres."),
    productType: z.enum(productTypes),
    categoryIds: z.array(z.string()),
    saleUnit: z.enum(saleUnits),
    decimalPlaces: z.string(),
    allowsNegative: z.boolean(),
    tracksLots: z.boolean(),
    shelfLifeDays: z.string(),
    collectionId: z.string(),
    launchedOn: z.string(),
    hasGrid: z.boolean(),
    attributes: z.array(attributeSchema),
    variants: z.array(variantSchema),
    eventIds: z.array(z.string()),
    suppliers: z.array(supplierSchema),
  })
  .superRefine((data, context) => {
    const fail = (path: (string | number)[], message: string) =>
      context.addIssue({ code: "custom", path, message });

    const places = Number(data.decimalPlaces);
    if (
      data.decimalPlaces.trim() === "" ||
      !Number.isInteger(places) ||
      places < 0 ||
      places > 3
    ) {
      fail(["decimalPlaces"], "As casas decimais devem ser de 0 a 3.");
    }

    if (data.tracksLots) {
      const days = Number(data.shelfLifeDays);
      if (
        data.shelfLifeDays.trim() === "" ||
        !Number.isInteger(days) ||
        days <= 0
      ) {
        fail(["shelfLifeDays"], "Informe a vida útil, maior que zero.");
      }
    }

    if (data.hasGrid) {
      if (data.attributes.length === 0) {
        fail(["attributes"], "Adicione ao menos um atributo.");
      }
      data.attributes.forEach((attribute, index) => {
        if (!attribute.name.trim()) {
          fail(["attributes", index, "name"], "Informe o nome do atributo.");
        }
        if (attribute.values.length === 0) {
          fail(
            ["attributes", index, "values"],
            "O atributo precisa de ao menos um valor."
          );
        }
        if (attribute.name.trim().length > 50) {
          fail(
            ["attributes", index, "name"],
            "O nome do atributo deve ter no máximo 50 caracteres."
          );
        }
        if (attribute.values.some((item) => item.value.trim().length > 50)) {
          fail(
            ["attributes", index, "values"],
            "O valor deve ter no máximo 50 caracteres."
          );
        }
      });
      repeatedIndexes(data.attributes.map((a) => a.name)).forEach((index) =>
        fail(["attributes", index, "name"], "Há atributos com o mesmo nome.")
      );
    }

    // Fornecedores (RN-CE27, RN-CE30): um por produto, no máximo um preferido, quantidades inteiras e positivas.
    if (data.suppliers.filter((supplier) => supplier.isPreferred).length > 1) {
      fail(["suppliers"], "Só um fornecedor pode ser o preferido.");
    }
    data.suppliers.forEach((supplier, index) => {
      if (!supplier.supplierId) {
        fail(["suppliers", index, "supplierId"], "Escolha o fornecedor.");
      } else if (
        data.suppliers.findIndex(
          (s) => s.supplierId === supplier.supplierId
        ) !== index
      ) {
        fail(
          ["suppliers", index, "supplierId"],
          "Este fornecedor já está na lista."
        );
      }
      if (supplier.supplierSku.trim().length > 50) {
        fail(
          ["suppliers", index, "supplierSku"],
          "O código no fornecedor deve ter no máximo 50 caracteres."
        );
      }
      if (supplier.leadTimeDays.trim() !== "") {
        const days = Number(supplier.leadTimeDays);
        if (!Number.isInteger(days) || days < 1 || days > 180) {
          fail(
            ["suppliers", index, "leadTimeDays"],
            "O prazo de entrega deve ser de 1 a 180 dias."
          );
        }
      }
      if (
        supplier.minOrderQty.trim() !== "" &&
        !isPositiveInteger(supplier.minOrderQty)
      ) {
        fail(
          ["suppliers", index, "minOrderQty"],
          "O pedido mínimo deve ser um número inteiro maior que zero."
        );
      }
      if (
        supplier.orderMultiple.trim() !== "" &&
        !isPositiveInteger(supplier.orderMultiple)
      ) {
        fail(
          ["suppliers", index, "orderMultiple"],
          "O múltiplo de compra deve ser um número inteiro maior que zero."
        );
      }
    });

    if (data.variants.length === 0) {
      fail(
        ["variants"],
        data.hasGrid
          ? "Gere as combinações antes de salvar."
          : "O produto precisa de ao menos uma variação."
      );
      return;
    }

    if (!data.variants.some((variant) => variant.isActive)) {
      fail(["variants"], "O produto precisa de ao menos uma variação ativa.");
    }

    data.variants.forEach((variant, index) => {
      if (!variant.sku.trim()) {
        fail(["variants", index, "sku"], "Informe o SKU.");
      } else if (variant.sku.trim().length > 50) {
        fail(
          ["variants", index, "sku"],
          "O SKU deve ter no máximo 50 caracteres."
        );
      }
      if (variant.barcode.trim().length > 50) {
        fail(
          ["variants", index, "barcode"],
          "O código de barras deve ter no máximo 50 caracteres."
        );
      }
      const price = parsePrice(variant.price);
      if (!(price > 0)) {
        fail(["variants", index, "price"], "O preço deve ser maior que zero.");
      } else if (Math.round(price * 100) / 100 !== price) {
        fail(
          ["variants", index, "price"],
          "O preço aceita até 2 casas decimais."
        );
      }
      if (
        data.hasGrid &&
        variant.attributeValueIds.length !== data.attributes.length
      ) {
        fail(
          ["variants"],
          "A grade mudou: gere as combinações de novo antes de salvar."
        );
      }
    });

    repeatedIndexes(data.variants.map((v) => v.sku)).forEach((index) =>
      fail(["variants", index, "sku"], "Este SKU está repetido no formulário.")
    );
    repeatedIndexes(data.variants.map((v) => v.barcode)).forEach((index) =>
      fail(
        ["variants", index, "barcode"],
        "Este código de barras está repetido no formulário."
      )
    );
  });

export type ProductFormData = z.infer<typeof productSchema>;
