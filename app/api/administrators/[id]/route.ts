import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireRole } from "@/lib/auth/guards";
import { administratorService } from "@/lib/server/services/administratorService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireRole(req, "superAdmin");
  const { id } = await params;
  return administratorService.getById(Number(id));
});

export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  requireRole(req, "superAdmin");
  const { id } = await params;
  const body = await req.json();
  return administratorService.update(Number(id), body);
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  requireRole(req, "superAdmin");
  const { id } = await params;
  return administratorService.softDelete(Number(id));
});
