import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { scoreService } from "@/lib/server/services/scoreService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { studentId } = await params;
  return scoreService.listByStudent(Number(studentId));
});
