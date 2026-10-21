import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { peopleService } from "@/lib/server/services/peopleService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  return peopleService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return peopleService.create(body);
});
