import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { scoreService } from "@/lib/server/services/scoreService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return scoreService.getById(Number(id));
});

export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  const body = await req.json();
  return scoreService.update(Number(id), body);
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return scoreService.softDelete(Number(id));
});
