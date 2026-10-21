import { z } from "zod";

export const subjectCreateSchema = z.object({
  careerId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(120).transform((v) => v.toUpperCase()),
  period: z.coerce.number().int().min(1).max(9),
});

export const subjectUpdateSchema = subjectCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>;
