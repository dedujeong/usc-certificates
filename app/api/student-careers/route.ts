import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { studentCareerService } from "@/lib/server/services/studentCareerService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  return studentCareerService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return studentCareerService.create(body);
});
