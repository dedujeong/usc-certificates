import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { careerService } from "@/lib/server/services/careerService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return careerService.getById(Number(id));
});

export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  const body = await req.json();
  return careerService.update(Number(id), body);
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return careerService.softDelete(Number(id));
});
