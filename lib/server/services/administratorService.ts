import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { NotFoundError } from "@/lib/server/http";
import {
  administratorCreateSchema,
  administratorUpdateSchema,
} from "@/lib/validators/administrator.schema";

/**
 * Administrators don't fit the generic crudFactory: creating one means
 * creating a User (email/password/role) and an Admin (profile) together,
 * atomically. This mirrors the old system's User+Admin split but adds the
 * password hashing that never existed before.
 */
export const administratorService = {
  async list() {
    return prisma.admin.findMany({
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
      orderBy: { firstName: "asc" },
    });
  },

  async getById(id: number) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });
    if (!admin) throw new NotFoundError();
    return admin;
  },

  async create(input: unknown) {
    const data = administratorCreateSchema.parse(input);
    const passwordHash = hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: data.email, passwordHash, role: data.role },
      });
      return tx.admin.create({
        data: {
          firstName: data.firstName,
          paternalName: data.paternalName,
          maternalName: data.maternalName,
          userId: user.id,
        },
        include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
      });
    });
  },

  async update(id: number, input: unknown) {
    const data = administratorUpdateSchema.parse(input);
    const { role, isActive, ...adminFields } = data;

    return prisma.$transaction(async (tx) => {
      const admin = await tx.admin.update({
        where: { id },
        data: { ...adminFields, isActive },
      });
      if (role !== undefined) {
        await tx.user.update({ where: { id: admin.userId }, data: { role } });
      }
      return tx.admin.findUniqueOrThrow({
        where: { id },
        include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
      });
    });
  },

  async softDelete(id: number) {
    const admin = await prisma.admin.update({ where: { id }, data: { isActive: false } });
    await prisma.user.update({ where: { id: admin.userId }, data: { isActive: false } });
    return admin;
  },

  async reactivate(id: number) {
    const admin = await prisma.admin.update({ where: { id }, data: { isActive: true } });
    await prisma.user.update({ where: { id: admin.userId }, data: { isActive: true } });
    return admin;
  },
};
