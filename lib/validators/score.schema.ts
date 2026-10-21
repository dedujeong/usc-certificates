import { z } from "zod";

const observationEnum = z.enum(["EX", "TS", "EQ", "REC"]);

export const scoreCreateSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
  value: z.coerce.number().min(0).max(10),
  observation: observationEnum.optional(),
});

export const scoreUpdateSchema = z.object({
  value: z.coerce.number().min(0).max(10).optional(),
  observation: observationEnum.optional().nullable(),
  isActive: z.boolean().optional(),
});

export type ScoreCreateInput = z.infer<typeof scoreCreateSchema>;
export type ScoreUpdateInput = z.infer<typeof scoreUpdateSchema>;
