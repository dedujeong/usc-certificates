import { z } from "zod";

export const studentCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(120).transform((v) => v.toUpperCase()),
  paternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
  maternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  // Upper bound is Postgres' INT max, the column type of students.tuition.
  tuition: z.number().int().min(1).max(2147483647).optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
