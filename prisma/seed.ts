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
  await prisma.certificateField.upsert({
    where: { name: "SCHOOL_NAME" },
    update: {},
    create: { name: "SCHOOL_NAME", value: "UNIVERSIDAD USC" },
  });
  await prisma.certificateField.upsert({
    where: { name: "SCHOOL_ADDRESS" },
    update: {},
    create: { name: "SCHOOL_ADDRESS", value: "DIRECCIÓN DE EJEMPLO, CIUDAD" },
  });

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
