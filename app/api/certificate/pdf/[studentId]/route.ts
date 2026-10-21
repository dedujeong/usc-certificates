import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { buildCertificateData } from "@/lib/server/services/certificateDataService";
import { renderCertificatePdf } from "@/lib/server/services/certificatePdfService";

const bodySchema = z.object({
  certificateNumber: z.string().trim().min(1),
  exp: z.string().trim().min(1),
});

/**
 * Returns the actual PDF bytes (not JSON) — kept separate from
 * GET /api/certificate/data/[studentId], which the client still uses for
 * the pre-generation summary (student name/career) without paying the
 * cost of launching a headless browser just to show a preview.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    requireAuth(req);
    const { studentId } = await params;
    const body = bodySchema.parse(await req.json());

    const base = await buildCertificateData(Number(studentId));
    const pdf = await renderCertificatePdf({ ...base, ...body });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.exp}-${base.studentTuition}-CER-AQ.pdf"`,
      },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Error generating certificate";
    return NextResponse.json({ error: { message } }, { status });
  }
}
