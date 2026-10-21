import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { peopleService } from "@/lib/server/services/peopleService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return peopleService.getById(Number(id));
});

export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  const body = await req.json();
  return peopleService.update(Number(id), body);
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return peopleService.remove(Number(id));
});
