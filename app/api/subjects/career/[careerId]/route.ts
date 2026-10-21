import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { listSubjectsByCareer } from "@/lib/server/services/subjectService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { careerId } = await params;
  return listSubjectsByCareer(Number(careerId));
});
