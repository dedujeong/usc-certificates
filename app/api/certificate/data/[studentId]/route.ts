import { NextRequest } from "next/server";
import { handleRoute } from "@/lib/server/http";
import { requireAuth } from "@/lib/auth/guards";
import { buildCertificateData } from "@/lib/server/services/certificateDataService";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  requireAuth(req);
  const { studentId } = await params;
  return buildCertificateData(Number(studentId));
});
