import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const productSchema = z.object({
  supplierId: z
    .string()
    .min(1, "O Fornecedor é obrigatório.")
    .uuid("Selecione um fornecedor válido."),

  productCode: z.string().min(1, "O código é obrigatório"),

  name: z
    .string()
    .min(1, "O nome é obrigatório")
    .max(100, "O nome não pode exceder 100 caracteres"),

  description: z
    .string()
    .min(1, "A descrição é obrigatória")
    .max(500, "A descrição não pode exceder 500 caracteres"),

  image: z
    .any()
    .optional()
    .refine((file) => {
      if (!file || !(file instanceof File)) return true;
      return file.size <= MAX_FILE_SIZE;
    }, "O tamanho máximo da imagem é 5MB.")
    .refine((file) => {
      if (!file || !(file instanceof File)) return true;
      return ACCEPTED_IMAGE_TYPES.includes(file.type);
    }, "Formatos aceitos: .jpg, .jpeg, .png e .webp."),

  categoryIds: z.array(z.string().uuid()).optional().default([]),

  quantity: z.coerce
    .number()
    .min(0, "A quantidade em estoque não pode ser negativa"),

  unitType: z.coerce.number().min(0, "O tipo de unidade é obrigatório"),

  price: z.coerce.number().min(0, "O preço não pode ser negativo"),

  validity: z.string().nullish().or(z.literal("")),
});

export type ProductSchema = z.infer<typeof productSchema>;
