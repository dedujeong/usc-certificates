import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { studentService } from "@/lib/server/services/studentService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  return studentService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return studentService.create(body);
});
