import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/server/http";
import {
  studentCareerCreateSchema,
  studentCareerUpdateSchema,
} from "@/lib/validators/studentCareer.schema";

/**
 * Fixes the old system's re-enrollment bug: `postStudentCareer` used to
 * reject ANY new enrollment once a student had any row (even inactive) for
 * STUDENT_ID, because the duplicate check didn't filter by status. Here,
 * only one ACTIVE enrollment per student is enforced, via the partial
 * unique index added in prisma/migrations/20261021030400_business_rules
 * (`student_careers_one_active_per_student`). A student can freely be
 * re-enrolled in a different career after their previous enrollment is
 * deactivated.
 */
export const studentCareerService = {
  async list() {
    return prisma.studentCareer.findMany({
      include: { student: true, career: true },
      orderBy: { id: "desc" },
    });
  },

  async getById(id: number) {
    const row = await prisma.studentCareer.findUnique({
      where: { id },
      include: { student: true, career: true },
    });
    if (!row) throw new NotFoundError();
    return row;
  },

  async getActiveByStudent(studentId: number) {
    const row = await prisma.studentCareer.findFirst({
      where: { studentId, isActive: true },
      include: { student: true, career: true },
    });
    if (!row) throw new NotFoundError("This student has no active career enrollment");
    return row;
  },

  async create(input: unknown) {
    const data = studentCareerCreateSchema.parse(input);
    try {
      return await prisma.studentCareer.create({
        data,
        include: { student: true, career: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("This student already has an active career enrollment");
      }
      throw err;
    }
  },

  async update(id: number, input: unknown) {
    const data = studentCareerUpdateSchema.parse(input);
    try {
      return await prisma.studentCareer.update({
        where: { id },
        data,
        include: { student: true, career: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("This student already has an active career enrollment");
      }
      throw err;
    }
  },

  async softDelete(id: number) {
    return prisma.studentCareer.update({ where: { id }, data: { isActive: false } });
  },
};
