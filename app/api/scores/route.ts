import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { scoreService } from "@/lib/server/services/scoreService";

export const POST = handleRoute(async (req: NextRequest) => {
  requireAuth(req);
  const body = await req.json();
  return scoreService.create(body);
});
