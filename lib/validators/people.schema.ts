import { z } from "zod";

export const personCreateSchema = z.object({
  prefix: z.string().trim().max(20).transform((v) => v.toUpperCase()).optional(),
  name: z.string().trim().min(1).max(160).transform((v) => v.toUpperCase()),
  charge: z.string().trim().min(1).max(160).transform((v) => v.toUpperCase()),
  gender: z.enum(["male", "female"]),
});

export const personUpdateSchema = personCreateSchema.partial();

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
