import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { studentService } from "@/lib/server/services/studentService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return studentService.getById(Number(id));
});

export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  const body = await req.json();
  return studentService.update(Number(id), body);
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { id } = await params;
  return studentService.softDelete(Number(id));
});
