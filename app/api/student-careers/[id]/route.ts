import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { studentCareerService } from "@/lib/server/services/studentCareerService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return studentCareerService.getById(Number(id));
});

export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  const body = await req.json();
  return studentCareerService.update(Number(id), body);
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return studentCareerService.softDelete(Number(id));
});
