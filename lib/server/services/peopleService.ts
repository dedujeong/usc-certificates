import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/server/http";
import { personCreateSchema, personUpdateSchema } from "@/lib/validators/people.schema";

// People (certificate signatories) use hard delete, matching the old
// system's behavior — there's no isActive/status concept for signatories.
export const peopleService = {
  async list() {
    return prisma.person.findMany({ orderBy: { name: "asc" } });
  },

  async getById(id: number) {
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundError();
    return person;
  },

  async create(input: unknown) {
    const data = personCreateSchema.parse(input);
    return prisma.person.create({ data });
  },

  async update(id: number, input: unknown) {
    const data = personUpdateSchema.parse(input);
    return prisma.person.update({ where: { id }, data });
  },

  async remove(id: number) {
    return prisma.person.delete({ where: { id } });
  },
};
