import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { studentCareerService } from "@/lib/server/services/studentCareerService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { studentId } = await params;
  return studentCareerService.getActiveByStudent(Number(studentId));
});
