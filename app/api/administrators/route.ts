import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireRole } from "@/lib/auth/guards";
import { administratorService } from "@/lib/server/services/administratorService";

export const GET = handleRoute(async (req: NextRequest) => {
  requireRole(req, "superAdmin");
  return administratorService.list();
});

export const POST = handleRoute(async (req: NextRequest) => {
  requireRole(req, "superAdmin");
  const body = await req.json();
  return administratorService.create(body);
});
