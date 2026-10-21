import { z } from "zod";

export const certificateFieldCreateSchema = z.object({
  name: z.string().trim().min(1).max(80).transform((v) => v.toUpperCase()),
  value: z.string().trim().min(1).transform((v) => v.toUpperCase()),
});

export const certificateFieldUpdateSchema = certificateFieldCreateSchema.partial();

export type CertificateFieldCreateInput = z.infer<typeof certificateFieldCreateSchema>;
export type CertificateFieldUpdateInput = z.infer<typeof certificateFieldUpdateSchema>;
