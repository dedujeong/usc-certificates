import { prisma, createCrudService } from "@/lib/server/crudFactory";
import { subjectCreateSchema, subjectUpdateSchema } from "@/lib/validators/subject.schema";

export const subjectService = createCrudService({
  delegate: prisma.subject,
  createSchema: subjectCreateSchema,
  updateSchema: subjectUpdateSchema,
  include: { career: true },
  orderBy: { period: "asc" },
});

export async function listSubjectsByCareer(careerId: number) {
  return prisma.subject.findMany({
    where: { careerId },
    orderBy: { period: "asc" },
  });
}
