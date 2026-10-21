import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/server/http";
import {
  certificateFieldCreateSchema,
  certificateFieldUpdateSchema,
} from "@/lib/validators/certificateField.schema";

// Certificate fields use hard delete, matching the old system's behavior.
export const certificateFieldService = {
  async list() {
    return prisma.certificateField.findMany({ orderBy: { name: "asc" } });
  },

  async getById(id: number) {
    const field = await prisma.certificateField.findUnique({ where: { id } });
    if (!field) throw new NotFoundError();
    return field;
  },

  async create(input: unknown) {
    const data = certificateFieldCreateSchema.parse(input);
    return prisma.certificateField.create({ data });
  },

  async update(id: number, input: unknown) {
    const data = certificateFieldUpdateSchema.parse(input);
    return prisma.certificateField.update({ where: { id }, data });
  },

  async remove(id: number) {
    return prisma.certificateField.delete({ where: { id } });
  },
};
