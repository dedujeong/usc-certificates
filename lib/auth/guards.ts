import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";
import { UnauthorizedError, ForbiddenError } from "@/lib/server/http";

export function requireAuth(req: NextRequest): JwtPayload {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }
  const token = header.slice("Bearer ".length);
  try {
    return verifyToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function requireRole(req: NextRequest, role: "admin" | "superAdmin"): JwtPayload {
  const payload = requireAuth(req);
  if (payload.role !== role) {
    throw new ForbiddenError();
  }
  return payload;
}
