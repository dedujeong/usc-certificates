import { z } from "zod";

// Upper bound is Postgres' INT max, the column type of students.tuition.
const tuitionSchema = z.number().int().min(1).max(2147483647);

export const studentCreateSchema = z.object({
  // Optional: when omitted, the next value of student_tuition_seq is used.
  tuition: tuitionSchema.optional(),
  firstName: z.string().trim().min(1).max(120).transform((v) => v.toUpperCase()),
  paternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
  maternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
