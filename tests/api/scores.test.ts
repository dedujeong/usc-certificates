import { describe, it, expect, beforeEach } from "vitest";
import { POST as createScore } from "@/app/api/scores/route";
import { prisma } from "@/lib/prisma";
import { resetDb, createTestUser, authHeaders } from "../helpers/db";
import { req, noParams } from "../helpers/request";

describe("scores", () => {
  let token: string;
  let studentId: number;
  let subjectId: number;

  beforeEach(async () => {
    await resetDb();
    token = (await createTestUser()).token;
    const student = await prisma.student.create({ data: { firstName: "TEST", tuition: 1 } });
    const career = await prisma.career.create({ data: { name: "CAREER" } });
    const subject = await prisma.subject.create({ data: { careerId: career.id, name: "SUBJECT", period: 1 } });
    studentId = student.id;
    subjectId = subject.id;
  });

  // Regression test for the old system's precision bug: SCORE was
  // INTEGER (originally DECIMAL(3,1), silently downgraded), so a score
  // like 8.5 was truncated to 8 or 9. It's now Prisma Decimal(3,1).
  it("preserves exact decimal precision", async () => {
    const res = await createScore(
      req("http://localhost/api/scores", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, subjectId, value: 7.5, observation: "TS" }),
      }),
      noParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.value).toBe("7.5");
  });

  it("rejects a duplicate score for the same student and subject", async () => {
    await createScore(
      req("http://localhost/api/scores", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, subjectId, value: 8 }),
      }),
      noParams,
    );

    const res = await createScore(
      req("http://localhost/api/scores", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, subjectId, value: 9 }),
      }),
      noParams,
    );

    expect(res.status).toBe(409);
  });

  it("rejects a score outside the 0-10 range", async () => {
    const res = await createScore(
      req("http://localhost/api/scores", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ studentId, subjectId, value: 11 }),
      }),
      noParams,
    );

    expect(res.status).toBe(400);
  });
});
