import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { careerService } from "@/lib/server/services/careerService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  return careerService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return careerService.create(body);
});
