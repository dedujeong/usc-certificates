import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/server/http";
import { scoreCreateSchema, scoreUpdateSchema } from "@/lib/validators/score.schema";

/**
 * Fixes two issues in the old scores controller: an inconsistent response
 * shape (`{ scores }` wrapper, unlike every other resource's bare array)
 * and a broken `res.send(500).json(...)` error path — both are now handled
 * uniformly by lib/server/http.ts's handleRoute. Also fixes score precision:
 * the old SCORE column was INTEGER (originally DECIMAL(3,1), silently
 * downgraded), so decimals like 8.5 were truncated. Score.value is now
 * Prisma Decimal(3,1).
 */
export const scoreService = {
  async listByStudent(studentId: number) {
    return prisma.score.findMany({
      where: { studentId },
      include: { subject: true },
      orderBy: { subjectId: "asc" },
    });
  },

  async getById(id: number) {
    const score = await prisma.score.findUnique({ where: { id }, include: { subject: true } });
    if (!score) throw new NotFoundError();
    return score;
  },

  async create(input: unknown) {
    const data = scoreCreateSchema.parse(input);
    try {
      return await prisma.score.create({
        data: { ...data, value: new Prisma.Decimal(data.value) },
        include: { subject: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("A score already exists for this student and subject");
      }
      throw err;
    }
  },

  async update(id: number, input: unknown) {
    const data = scoreUpdateSchema.parse(input);
    return prisma.score.update({
      where: { id },
      data: { ...data, value: data.value !== undefined ? new Prisma.Decimal(data.value) : undefined },
      include: { subject: true },
    });
  },

  async softDelete(id: number) {
    return prisma.score.update({ where: { id }, data: { isActive: false } });
  },
};
