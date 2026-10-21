import { describe, it, expect, beforeEach } from "vitest";
import { POST as createStudentCareer } from "@/app/api/student-careers/route";
import { DELETE as deleteStudentCareer } from "@/app/api/student-careers/[id]/route";
import { prisma } from "@/lib/prisma";
import { resetDb, createTestUser, authHeaders } from "../helpers/db";
import { req, noParams } from "../helpers/request";

describe("student-careers", () => {
  let token: string;
  let studentId: number;
  let careerAId: number;
  let careerBId: number;

  beforeEach(async () => {
    await resetDb();
    token = (await createTestUser()).token;
    const student = await prisma.student.create({ data: { firstName: "TEST", tuition: 1 } });
    studentId = student.id;
    const careerA = await prisma.career.create({ data: { name: "CAREER A" } });
    const careerB = await prisma.career.create({ data: { name: "CAREER B" } });
    careerAId = careerA.id;
    careerBId = careerB.id;
  });

  it("rejects a second active enrollment for the same student", async () => {
    await createStudentCareer(
      req("http://localhost/api/student-careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, careerId: careerAId, startDate: "2024-01-01", endDate: "2027-01-01" }),
      }),
      noParams,
    );

    const res = await createStudentCareer(
      req("http://localhost/api/student-careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, careerId: careerBId, startDate: "2024-01-01", endDate: "2027-01-01" }),
      }),
      noParams,
    );

    expect(res.status).toBe(409);
  });

  // Regression test for the old system's re-enrollment bug: deactivating a
  // student's enrollment used to still permanently block any future
  // enrollment for that student, because the duplicate check in
  // postStudentCareer didn't filter by status. Only ACTIVE enrollments
  // should be exclusive now.
  it("allows re-enrollment in a different career after the previous one is deactivated", async () => {
    const first = await createStudentCareer(
      req("http://localhost/api/student-careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, careerId: careerAId, startDate: "2024-01-01", endDate: "2027-01-01" }),
      }),
      noParams,
    );
    const firstBody = await first.json();

    await deleteStudentCareer(
      req(`http://localhost/api/student-careers/${firstBody.data.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      }),
      { params: Promise.resolve({ id: String(firstBody.data.id) }) },
    );

    const second = await createStudentCareer(
      req("http://localhost/api/student-careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, careerId: careerBId, startDate: "2024-01-01", endDate: "2027-01-01" }),
      }),
      noParams,
    );

    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.data.careerId).toBe(careerBId);
    expect(secondBody.data.isActive).toBe(true);
  });
});
