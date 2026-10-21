import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "./http";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaDelegate = {
  findMany: (args?: any) => Promise<unknown[]>;
  findUniqueOrThrow: (args: any) => Promise<unknown>;
  create: (args: any) => Promise<unknown>;
  update: (args: any) => Promise<unknown>;
};

interface CrudConfig<TCreate, TUpdate> {
  delegate: PrismaDelegate;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  /** Field used for soft-delete, e.g. "isActive". Defaults to "isActive". */
  softDeleteField?: string;
  /** Extra filter applied to list(), e.g. { isActive: true } to hide soft-deleted rows. */
  listWhere?: Record<string, unknown>;
  include?: Record<string, boolean>;
  orderBy?: Record<string, "asc" | "desc">;
}

/**
 * Generic CRUD service factory over a Prisma delegate, replacing the
 * near-identical list/getById/create/update/softDelete logic that used to
 * be copy-pasted across 9 Express controllers in the old system.
 *
 * Resources with special business rules (students, studentCareers, scores,
 * administrators) should NOT force their logic through this factory —
 * they compose their own service and reuse only the pieces that fit
 * (see lib/server/services/studentService.ts for an example).
 */
export function createCrudService<TCreate, TUpdate>(config: CrudConfig<TCreate, TUpdate>) {
  return {
    async list() {
      return config.delegate.findMany({
        where: config.listWhere,
        include: config.include,
        orderBy: config.orderBy,
      });
    },

    async getById(id: number) {
      try {
        return await config.delegate.findUniqueOrThrow({
          where: { id },
          include: config.include,
        });
      } catch {
        throw new NotFoundError();
      }
    },

    async create(input: unknown) {
      const data = config.createSchema.parse(input);
      return config.delegate.create({ data, include: config.include });
    },

    async update(id: number, input: unknown) {
      const data = config.updateSchema.parse(input);
      return config.delegate.update({ where: { id }, data, include: config.include });
    },

    async softDelete(id: number) {
      const field = config.softDeleteField ?? "isActive";
      return config.delegate.update({ where: { id }, data: { [field]: false } });
    },

    async reactivate(id: number) {
      const field = config.softDeleteField ?? "isActive";
      return config.delegate.update({ where: { id }, data: { [field]: true } });
    },
  };
}

export { prisma };
