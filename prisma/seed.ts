import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import realSeedData from "./realSeedData.json";

const prisma = new PrismaClient();

// Real institutional data (careers, subject catalog, certificate fields,
// signatories) extracted from the old system's production database dump
// (server/database/backup/20260304.sql in the old repo) — see
// prisma/realSeedData.json. Student/score records were NOT carried over
// (that data was confirmed to be test-only), so this seed still creates
// zero students.
const data = realSeedData as {
  careers: string[];
  subjects: { careerName: string; name: string; period: number }[];
  certificateFields: Record<string, string>;
  people: { prefix: string; name: string; charge: string; gender: "male" | "female" }[];
};

async function main() {
  console.log("Seeding careers...");
  const careers = await Promise.all(
    data.careers.map((name) =>
      prisma.career.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  const careerIdByName = new Map(careers.map((c) => [c.name, c.id]));

  console.log(`Seeding ${data.subjects.length} subjects...`);
  const existingSubjects = await prisma.subject.count();
  if (existingSubjects === 0) {
    for (const subject of data.subjects) {
      const careerId = careerIdByName.get(subject.careerName);
      if (!careerId) continue;
      await prisma.subject.create({
        data: { careerId, name: subject.name, period: subject.period },
      });
    }
  }

  console.log("Seeding certificate fields...");
  for (const [name, value] of Object.entries(data.certificateFields)) {
    await prisma.certificateField.upsert({ where: { name }, update: {}, create: { name, value } });
  }

  console.log("Seeding certificate signatories (people, roles 1-7)...");
  // The certificate layout references signatories positionally (1st, 2nd,
  // ... 7th person created), matching the old system's behavior of
  // reading `PEOPLE[1..7]` from a plain ordered list — see
  // certificate/render/types.ts and app/api/certificate/data/[studentId].
  const existingPeople = await prisma.person.count();
  if (existingPeople === 0) {
    for (const person of data.people) {
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
