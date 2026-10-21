import { z } from "zod";

export const administratorCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(120).transform((v) => v.toUpperCase()),
  paternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
  maternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["admin", "superAdmin"]).default("admin"),
});

export const administratorUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(120).transform((v) => v.toUpperCase()).optional(),
  paternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
  maternalName: z.string().trim().max(120).transform((v) => v.toUpperCase()).optional(),
  role: z.enum(["admin", "superAdmin"]).optional(),
  isActive: z.boolean().optional(),
});

export type AdministratorCreateInput = z.infer<typeof administratorCreateSchema>;
export type AdministratorUpdateInput = z.infer<typeof administratorUpdateSchema>;
