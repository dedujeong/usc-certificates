import { z } from "zod";

export const careerCreateSchema = z.object({
  name: z.string().trim().min(1).max(120).transform((v) => v.toUpperCase()),
});

export const careerUpdateSchema = careerCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CareerCreateInput = z.infer<typeof careerCreateSchema>;
export type CareerUpdateInput = z.infer<typeof careerUpdateSchema>;
