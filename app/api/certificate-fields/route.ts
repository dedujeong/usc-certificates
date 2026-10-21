import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { certificateFieldService } from "@/lib/server/services/certificateFieldService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  return certificateFieldService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return certificateFieldService.create(body);
});
