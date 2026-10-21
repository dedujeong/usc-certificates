import { NextRequest } from "next/server";
import { handleRoute, UnauthorizedError, HttpError } from "@/lib/server/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth.schema";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { checkLoginRateLimit } from "@/lib/auth/rateLimit";

export const POST = handleRoute(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkLoginRateLimit(ip)) {
    throw new HttpError(429, "Too many login attempts, try again later", "RATE_LIMITED");
  }

  const body = await req.json();
  const { email, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !comparePassword(password, user.passwordHash)) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
});
