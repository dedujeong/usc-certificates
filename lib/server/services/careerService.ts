import { prisma, createCrudService } from "@/lib/server/crudFactory";
import { careerCreateSchema, careerUpdateSchema } from "@/lib/validators/career.schema";

export const careerService = createCrudService({
  delegate: prisma.career,
  createSchema: careerCreateSchema,
  updateSchema: careerUpdateSchema,
  orderBy: { name: "asc" },
});
