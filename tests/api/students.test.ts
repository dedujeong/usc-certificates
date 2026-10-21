import { describe, it, expect, beforeEach } from "vitest";
import { POST as createStudent, GET as listStudents } from "@/app/api/students/route";
import { resetDb, createTestUser, authHeaders } from "../helpers/db";
import { req, noParams } from "../helpers/request";

describe("students", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = (await createTestUser()).token;
  });

  it("creates a student and assigns a tuition number", async () => {
    const res = await createStudent(
      req("http://localhost/api/students", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ firstName: "Ana" }),
      }),
      noParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.tuition).toBe(10000);
    expect(body.data.firstName).toBe("ANA");
  });

  // Regression test for the old system's race condition: the next tuition
  // number used to be computed client-side (read last + increment), which
  // could collide under concurrent registrations. It's now a Postgres
  // sequence, consumed atomically inside the insert.
  it("assigns unique, sequential tuition numbers under concurrent creation", async () => {
    const CONCURRENCY = 15;
    const responses = await Promise.all(
      Array.from({ length: CONCURRENCY }, (_, i) =>
        createStudent(
          req("http://localhost/api/students", {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ firstName: `Student${i}` }),
          }),
          noParams,
        ),
      ),
    );

    const tuitions = await Promise.all(responses.map(async (r) => (await r.json()).data.tuition));

    expect(tuitions).toHaveLength(CONCURRENCY);
    expect(new Set(tuitions).size).toBe(CONCURRENCY);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await listStudents(req("http://localhost/api/students"), noParams);
    expect(res.status).toBe(401);
  });
});
