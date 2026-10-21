import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { subjectService } from "@/lib/server/services/subjectService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  return subjectService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return subjectService.create(body);
});
