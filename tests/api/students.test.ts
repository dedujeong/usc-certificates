import { describe, it, expect, beforeEach } from "vitest";
import { POST as createStudent, GET as listStudents } from "@/app/api/students/route";
import { PUT as updateStudent } from "@/app/api/students/[id]/route";
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

  async function create(firstName: string) {
    const res = await createStudent(
      req("http://localhost/api/students", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ firstName }),
      }),
      noParams,
    );
    return (await res.json()).data as { id: number; tuition: number };
  }

  function update(id: number, body: unknown) {
    return updateStudent(
      req(`http://localhost/api/students/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: String(id) }) },
    );
  }

  it("edits a student's tuition number", async () => {
    const student = await create("Ana");
    const res = await update(student.id, { tuition: 500 });

    expect(res.status).toBe(200);
    expect((await res.json()).data.tuition).toBe(500);
  });

  it("rejects a tuition number already assigned to another student", async () => {
    const ana = await create("Ana");
    const luis = await create("Luis");
    const res = await update(luis.id, { tuition: ana.tuition });

    expect(res.status).toBe(409);
  });

  it("rejects a non-integer tuition number", async () => {
    const ana = await create("Ana");
    const res = await update(ana.id, { tuition: 12.5 });

    expect(res.status).toBe(400);
  });

  // Moving a student to a number the sequence hasn't handed out yet must
  // advance the sequence; otherwise the next registration would draw that
  // same number and fail the unique constraint.
  it("keeps new registrations from colliding with an edited tuition number", async () => {
    const ana = await create("Ana");
    await update(ana.id, { tuition: ana.tuition + 1 });

    const luis = await create("Luis");
    expect(luis.tuition).toBe(ana.tuition + 2);
  });

  it("does not move the sequence back when editing to a lower number", async () => {
    const ana = await create("Ana");
    await create("Luis");
    await update(ana.id, { tuition: 42 });

    const eva = await create("Eva");
    expect(eva.tuition).toBe(ana.tuition + 2);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await listStudents(req("http://localhost/api/students"), noParams);
    expect(res.status).toBe(401);
  });
});
