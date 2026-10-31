import { z } from "zod";
import { TContactType } from "@/types/enums";
import { formatOnlyNumbers } from "@/utils/format.helpers";
import { validateEmail } from "@/utils/validators";

export const contactSchema = z
  .object({
    type: z.enum(TContactType),
    value: z.string().trim().min(1, "Informe o contato."),
    isMain: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.value) return;
    if (data.type === TContactType.Email) {
      if (!validateEmail(data.value))
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Informe um e-mail válido.",
        });
      return;
    }
    const digits = formatOnlyNumbers(data.value).length;
    if (digits !== 10 && digits !== 11)
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Informe um telefone com DDD.",
      });
  });

export type ContactFormData = z.infer<typeof contactSchema>;
