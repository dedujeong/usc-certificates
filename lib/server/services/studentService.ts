import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/server/http";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validators/student.schema";

/**
 * Students don't use the generic crudFactory because `create` must call
 * nextval('student_tuition_seq') atomically inside the same insert, not as
 * a separate client-visible "preview" step — the old system computed the
 * next tuition number in the browser (getLastStudent + increment), which
 * is a race condition under concurrent registrations. Postgres sequences
 * are atomic even under concurrent transactions, which fixes that.
 */
export const studentService = {
  async list() {
    return prisma.student.findMany({ orderBy: { tuition: "asc" } });
  },

  async getById(id: number) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundError();
    return student;
  },

  async create(input: unknown) {
    const data = studentCreateSchema.parse(input);

    const [{ nextval }] = await prisma.$queryRaw<{ nextval: bigint }[]>(
      Prisma.sql`SELECT nextval('student_tuition_seq')`,
    );

    return prisma.student.create({
      data: { ...data, tuition: Number(nextval) },
    });
  },

  async update(id: number, input: unknown) {
    const data = studentUpdateSchema.parse(input);
    return prisma.student.update({ where: { id }, data });
  },

  async softDelete(id: number) {
    return prisma.student.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: number) {
    return prisma.student.update({ where: { id }, data: { isActive: true } });
  },

  /** Preview-only, for displaying "this will likely be the next tuition number" in the UI before submit. Not used for the actual insert. */
  async previewNextTuition() {
    const last = await prisma.student.findFirst({ orderBy: { tuition: "desc" } });
    return (last?.tuition ?? 9999) + 1;
  },
};
