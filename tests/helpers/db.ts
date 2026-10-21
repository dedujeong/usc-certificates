import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

export async function resetDb() {
  await prisma.$transaction([
    prisma.score.deleteMany(),
    prisma.studentCareer.deleteMany(),
    prisma.student.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.career.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.user.deleteMany(),
    prisma.person.deleteMany(),
    prisma.certificateField.deleteMany(),
  ]);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE student_tuition_seq RESTART WITH 10000`);
}

export async function createTestUser(role: "admin" | "superAdmin" = "admin") {
  const email = `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`;
  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword("password123"), role },
  });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user, token };
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}
