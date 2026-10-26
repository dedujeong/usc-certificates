import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/server/http";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validators/student.schema";

type Tx = Prisma.TransactionClient;

async function assertTuitionFree(tx: Tx, tuition: number, exceptStudentId?: number) {
  const taken = await tx.student.findFirst({
    where: { tuition, ...(exceptStudentId !== undefined && { NOT: { id: exceptStudentId } }) },
  });
  if (taken) throw new ConflictError(`Tuition ${tuition} is already assigned to another student`);
}

/**
 * A hand-typed tuition number must keep student_tuition_seq ahead of every
 * tuition in use: if a student gets a number the sequence hasn't handed out
 * yet, a later automatic registration would draw that same number and fail
 * the unique constraint. So the sequence is advanced past it (never moved
 * back), in the same transaction as the write.
 */
async function advanceTuitionSeqPast(tx: Tx, tuition: number) {
  await tx.$queryRaw(
    Prisma.sql`SELECT setval('student_tuition_seq', ${tuition}::bigint)
               FROM student_tuition_seq
               WHERE ${tuition}::bigint >= CASE WHEN is_called THEN last_value + 1 ELSE last_value END`,
  );
}

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
    const { tuition, ...data } = studentCreateSchema.parse(input);

    if (tuition !== undefined) {
      return prisma.$transaction(async (tx) => {
        await assertTuitionFree(tx, tuition);
        const student = await tx.student.create({ data: { ...data, tuition } });
        await advanceTuitionSeqPast(tx, tuition);
        return student;
      });
    }

    const [{ nextval }] = await prisma.$queryRaw<{ nextval: bigint }[]>(
      Prisma.sql`SELECT nextval('student_tuition_seq')`,
    );

    return prisma.student.create({
      data: { ...data, tuition: Number(nextval) },
    });
  },

  async update(id: number, input: unknown) {
    const data = studentUpdateSchema.parse(input);
    const { tuition } = data;
    if (tuition === undefined) {
      return prisma.student.update({ where: { id }, data });
    }

    return prisma.$transaction(async (tx) => {
      await assertTuitionFree(tx, tuition, id);
      const student = await tx.student.update({ where: { id }, data });
      await advanceTuitionSeqPast(tx, tuition);
      return student;
    });
  },

  async softDelete(id: number) {
    return prisma.student.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: number) {
    return prisma.student.update({ where: { id }, data: { isActive: true } });
  },

  /**
   * Preview-only, for displaying "this will likely be the next tuition number" in the UI before submit. Not used for the actual insert.
   * Reads the sequence itself rather than max(tuition) + 1: once tuition numbers can be typed or edited by hand, the two can differ.
   */
  async previewNextTuition() {
    const [{ next }] = await prisma.$queryRaw<{ next: bigint }[]>(
      Prisma.sql`SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END AS next FROM student_tuition_seq`,
    );
    return Number(next);
  },
};
