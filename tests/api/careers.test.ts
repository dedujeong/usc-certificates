import { describe, it, expect, beforeEach } from "vitest";
import { GET as listCareers, POST as createCareer } from "@/app/api/careers/route";
import { PUT as updateCareer, DELETE as deleteCareer } from "@/app/api/careers/[id]/route";
import { resetDb, createTestUser, authHeaders } from "../helpers/db";
import { req, noParams } from "../helpers/request";

// Exercises the generic crudFactory contract (lib/server/crudFactory.ts)
// through one representative resource; other pure-CRUD resources
// (subjects, certificate-fields, people) follow the same pattern.
describe("careers (generic CRUD contract)", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = (await createTestUser()).token;
  });

  it("creates, lists, updates and soft-deletes a career", async () => {
    const createRes = await createCareer(
      req("http://localhost/api/careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name: "Derecho" }),
      }),
      noParams,
    );
    const created = (await createRes.json()).data;
    expect(created.name).toBe("DERECHO");
    expect(created.isActive).toBe(true);

    const listRes = await listCareers(req("http://localhost/api/careers", { headers: authHeaders(token) }), noParams);
    expect((await listRes.json()).data).toHaveLength(1);

    const updateRes = await updateCareer(
      req(`http://localhost/api/careers/${created.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ name: "Derecho y Ciencias Sociales" }),
      }),
      { params: Promise.resolve({ id: String(created.id) }) },
    );
    expect((await updateRes.json()).data.name).toBe("DERECHO Y CIENCIAS SOCIALES");

    const deleteRes = await deleteCareer(
      req(`http://localhost/api/careers/${created.id}`, { method: "DELETE", headers: authHeaders(token) }),
      { params: Promise.resolve({ id: String(created.id) }) },
    );
    expect((await deleteRes.json()).data.isActive).toBe(false);
  });

  it("rejects a duplicate career name", async () => {
    await createCareer(
      req("http://localhost/api/careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name: "Arquitectura" }),
      }),
      noParams,
    );
    const res = await createCareer(
      req("http://localhost/api/careers", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name: "Arquitectura" }),
      }),
      noParams,
    );
    expect(res.status).toBe(409);
  });
});
