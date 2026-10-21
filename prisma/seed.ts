import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CAREERS = [
  "INGENIERÍA EN SISTEMAS COMPUTACIONALES",
  "ADMINISTRACIÓN DE EMPRESAS",
  "ARQUITECTURA",
  "CONTADURÍA PÚBLICA",
  "DERECHO",
  "DISEÑO GRÁFICO",
  "INFORMÁTICA ADMINISTRATIVA",
  "TRABAJO SOCIAL",
];

async function main() {
  console.log("Seeding careers...");
  const careers = await Promise.all(
    CAREERS.map((name) =>
      prisma.career.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log("Seeding subjects for the first career...");
  const firstCareer = careers[0];
  for (let period = 1; period <= 3; period++) {
    await prisma.subject.create({
      data: {
        careerId: firstCareer.id,
        name: `MATERIA DE EJEMPLO PERIODO ${period}`,
        period,
      },
    });
  }

  console.log("Seeding certificate fields...");
  const CERTIFICATE_FIELDS: Record<string, string> = {
    SCHOOL_NAME: "SAN CRISTÓBAL",
    SCHOOL_CITY: "SAN CRISTÓBAL DE LAS CASAS, CHIAPAS",
    REGIMEN: "PARTICULAR",
    TURNO: "MIXTO",
    CLAVE: "00PSU0000X",
    MODALIDAD: "ESCOLARIZADA",
    RVOE: "000000",
    VIGENCIA: "2024-01-01",
    SECL: "SE-CL-01",
    LEGAL_TOP: "Certificado que ampara {totalSubjects} ({totalSubjectsText}) materias, expedido el {dd} de {monthName} de {yyyy}.",
    LEGAL_1: "Texto legal de ejemplo, párrafo 1. *Editar en Administrar > Campos de certificado.*",
    LEGAL_2: "Texto legal de ejemplo, párrafo 2.",
  };
  for (const [name, value] of Object.entries(CERTIFICATE_FIELDS)) {
    await prisma.certificateField.upsert({ where: { name }, update: {}, create: { name, value } });
  }

  console.log("Seeding certificate signatories (people, roles 1-7)...");
  // The certificate layout references signatories positionally (1st, 2nd,
  // ... 7th person created), matching the old system's behavior of
  // reading `PEOPLE[1..7]` from a plain ordered list — see
  // certificate/render/types.ts and app/api/certificate/data/[studentId].
  const PEOPLE_SEED = [
    { name: "NOMBRE DIRECTOR GENERAL", charge: "DIRECTOR GENERAL", gender: "male" as const },
    { name: "NOMBRE DIRECTOR ACADEMICO", charge: "DIRECTOR ACADÉMICO", gender: "male" as const },
    { name: "NOMBRE RESPONSABLE LEGAL", charge: "REPRESENTANTE LEGAL", gender: "female" as const },
    { name: "NOMBRE SECRETARIO", charge: "SECRETARIO DE EDUCACIÓN", gender: "male" as const },
    { name: "NOMBRE SERVICIOS ESCOLARES", charge: "JEFE DE SERVICIOS ESCOLARES", gender: "female" as const },
    { name: "NOMBRE SUBSECRETARIO", charge: "SUBSECRETARIO DE EDUCACIÓN", gender: "male" as const },
    { name: "NOMBRE COTEJO", charge: "COTEJÓ", gender: "female" as const },
  ];
  const existingPeople = await prisma.person.count();
  if (existingPeople === 0) {
    for (const person of PEOPLE_SEED) {
      await prisma.person.create({ data: person });
    }
  }

  console.log("Seeding dev users (superAdmin + admin)...");
  const devPassword = bcrypt.hashSync("ChangeMe123!", 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@usc.dev" },
    update: {},
    create: {
      email: "superadmin@usc.dev",
      passwordHash: devPassword,
      role: "superAdmin",
    },
  });
  await prisma.admin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: { firstName: "SUPER ADMIN", userId: superAdminUser.id },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@usc.dev" },
    update: {},
    create: {
      email: "admin@usc.dev",
      passwordHash: devPassword,
      role: "admin",
    },
  });
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { firstName: "ADMIN", userId: adminUser.id },
  });

  console.log("Seed complete.");
  console.log("Dev credentials (CHANGE before any real deployment):");
  console.log("  superadmin@usc.dev / ChangeMe123!");
  console.log("  admin@usc.dev / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
