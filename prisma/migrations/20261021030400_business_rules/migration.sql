-- Enforce "only one active enrollment per student" at the database level.
-- Prisma's declarative schema cannot express a partial unique index, so it
-- is added here by hand (see prisma/schema.prisma comment on StudentCareer).
CREATE UNIQUE INDEX "student_careers_one_active_per_student"
  ON "student_careers" ("studentId")
  WHERE "isActive" = true;

-- Dedicated sequence for atomic tuition number generation. nextval() is
-- called inside the student-creation transaction (see lib/server/services/studentService.ts),
-- not precomputed client-side, which eliminates the race condition present
-- in the old system (client read-last-then-increment).
CREATE SEQUENCE IF NOT EXISTS "student_tuition_seq" START 10000;
