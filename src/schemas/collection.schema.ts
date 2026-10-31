import { z } from "zod";

/** Datas opcionais; com as duas, o fim não vem antes do início (RN-CE40). */
export const collectionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(100, "O nome deve ter no máximo 100 caracteres."),
    startsOn: z.string(),
    endsOn: z.string(),
  })
  .refine(
    ({ startsOn, endsOn }) => !startsOn || !endsOn || endsOn >= startsOn,
    { message: "O fim não pode ser antes do início.", path: ["endsOn"] }
  );

export type CollectionFormData = z.infer<typeof collectionSchema>;
