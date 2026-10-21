export interface CertificatePerson {
  id: number;
  prefix: string | null;
  name: string;
  charge: string;
  gender: "male" | "female";
}

export interface CertificateSubjectScore {
  subjectId: number;
  subjectName: string;
  period: number;
  value: number | null;
  observation: string | null;
}

/**
 * Everything renderCertificate() needs, assembled server-side by
 * GET /api/certificate/data/[studentId] in a single request — the old
 * system's certificatePDF.ts fetched subjects/scores itself in the middle
 * of rendering, mixing data access with layout.
 */
export interface CertificateData {
  schoolName: string;
  schoolCity: string;
  regimen: string;
  turno: string;
  clave: string;
  modalidad: string;
  rvoe: string;
  vigencia: string;
  secl: string;
  legalTop: string;
  legal1: string;
  legal2: string;

  studentId: number;
  studentName: string;
  studentTuition: number;
  studentCareer: string;
  careerId: number;
  studentStartPeriod: string;
  studentEndPeriod: string;

  /** Indexed by the Person's `id` (1..7), matching the fixed signatory
   *  roles the certificate template expects (see prisma/seed.ts). */
  people: Record<number, CertificatePerson>;

  subjectScores: CertificateSubjectScore[];
  /** True when the career's catalog includes a 9th period — determines a
   *  layout branch. The old system hardcoded `CAREER_ID === 7` for this,
   *  which only happened to work for one specific legacy database id;
   *  here it's derived from the actual subject catalog instead. */
  hasNinthPeriod: boolean;

  exp: string;
  certificateNumber: string;
}
