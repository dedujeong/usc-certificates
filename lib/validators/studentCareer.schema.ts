import { z } from "zod";

export const studentCareerCreateSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  careerId: z.coerce.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const studentCareerUpdateSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export type StudentCareerCreateInput = z.infer<typeof studentCareerCreateSchema>;
export type StudentCareerUpdateInput = z.infer<typeof studentCareerUpdateSchema>;
