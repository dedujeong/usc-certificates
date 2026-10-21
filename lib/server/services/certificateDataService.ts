import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/server/http";
import { CertificateData, CertificatePerson } from "@/certificate/render/types";

const FIELD_NAMES = [
  "SCHOOL_NAME",
  "SCHOOL_CITY",
  "REGIMEN",
  "TURNO",
  "CLAVE",
  "MODALIDAD",
  "RVOE",
  "VIGENCIA",
  "SECL",
  "LEGAL_TOP",
  "LEGAL_1",
  "LEGAL_2",
] as const;

/**
 * Aggregates everything certificate/render/renderCertificate.ts needs into
 * one payload — the old system's certificatePDF.ts fetched subjects and
 * scores itself in the middle of rendering (2+ separate round trips); this
 * endpoint does one Prisma query batch server-side instead.
 */
export async function buildCertificateData(studentId: number): Promise<Omit<CertificateData, "certificateNumber" | "exp">> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError("Student not found");

  const enrollment = await prisma.studentCareer.findFirst({
    where: { studentId, isActive: true },
    include: { career: { include: { subjects: { orderBy: { period: "asc" } } } } },
  });
  if (!enrollment) throw new NotFoundError("This student has no active career enrollment");

  const scores = await prisma.score.findMany({ where: { studentId }, include: { subject: true } });

  const fields = await prisma.certificateField.findMany({ where: { name: { in: [...FIELD_NAMES] } } });
  const fieldMap = Object.fromEntries(fields.map((f) => [f.name, f.value]));
  const styleMap = Object.fromEntries(fields.map((f) => [f.name, { fontFamily: f.fontFamily, lineHeight: f.lineHeight }]));

  const peopleRows = await prisma.person.findMany({ orderBy: { id: "asc" }, take: 7 });
  const people: Record<number, CertificatePerson> = {};
  peopleRows.forEach((p, index) => {
    people[index + 1] = { id: p.id, prefix: p.prefix, name: p.name, charge: p.charge, gender: p.gender };
  });

  const hasNinthPeriod = enrollment.career.subjects.some((s) => s.period === 9);

  const subjectScores = enrollment.career.subjects.map((subject) => {
    const score = scores.find((s) => s.subjectId === subject.id);
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      period: subject.period,
      value: score ? Number(score.value) : null,
      observation: score?.observation ?? null,
    };
  });

  return {
    schoolName: fieldMap.SCHOOL_NAME ?? "",
    schoolCity: fieldMap.SCHOOL_CITY ?? "",
    regimen: fieldMap.REGIMEN ?? "",
    turno: fieldMap.TURNO ?? "",
    clave: fieldMap.CLAVE ?? "",
    modalidad: fieldMap.MODALIDAD ?? "",
    rvoe: fieldMap.RVOE ?? "",
    vigencia: fieldMap.VIGENCIA ?? "",
    secl: fieldMap.SECL ?? "",
    legalTop: fieldMap.LEGAL_TOP ?? "",
    legal1: fieldMap.LEGAL_1 ?? "",
    legal2: fieldMap.LEGAL_2 ?? "",
    legal1FontFamily: styleMap.LEGAL_1?.fontFamily ?? null,
    legal1LineHeight: styleMap.LEGAL_1?.lineHeight ?? null,
    legal2FontFamily: styleMap.LEGAL_2?.fontFamily ?? null,
    legal2LineHeight: styleMap.LEGAL_2?.lineHeight ?? null,

    studentId: student.id,
    studentName: [student.firstName, student.paternalName, student.maternalName].filter(Boolean).join(" "),
    studentTuition: student.tuition,
    studentCareer: enrollment.career.name,
    careerId: enrollment.careerId,
    studentStartPeriod: enrollment.startDate.toISOString().slice(0, 10),
    studentEndPeriod: enrollment.endDate.toISOString().slice(0, 10),

    people,
    subjectScores,
    hasNinthPeriod,
  };
}
