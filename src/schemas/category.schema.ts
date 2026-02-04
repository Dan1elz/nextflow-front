import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string().uuid().optional(), 
  
  description: z
    .string()
    .min(1, "A Descrição é obrigatória")
    .max(100, "A Descrição deve ter no máximo 100 caracteres"),
});

export type CategorySchema = z.infer<typeof categorySchema>;