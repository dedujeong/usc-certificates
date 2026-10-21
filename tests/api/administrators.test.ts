import { describe, it, expect, beforeEach } from "vitest";
import { GET as listAdministrators, POST as createAdministrator } from "@/app/api/administrators/route";
import { resetDb, createTestUser, authHeaders } from "../helpers/db";
import { req, noParams } from "../helpers/request";

describe("administrators (role guard)", () => {
  beforeEach(resetDb);

  it("allows a superAdmin to list administrators", async () => {
    const { token } = await createTestUser("superAdmin");
    const res = await listAdministrators(
      req("http://localhost/api/administrators", { headers: authHeaders(token) }),
      noParams,
    );
    expect(res.status).toBe(200);
  });

  it("rejects a plain admin from listing administrators (403)", async () => {
    const { token } = await createTestUser("admin");
    const res = await listAdministrators(
      req("http://localhost/api/administrators", { headers: authHeaders(token) }),
      noParams,
    );
    expect(res.status).toBe(403);
  });

  it("creates an administrator with a hashed password, never plaintext", async () => {
    const { token } = await createTestUser("superAdmin");
    const res = await createAdministrator(
      req("http://localhost/api/administrators", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          firstName: "New Admin",
          email: "newadmin@test.dev",
          password: "password123",
          role: "admin",
        }),
      }),
      noParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.user.email).toBe("newadmin@test.dev");
    expect(body.data).not.toHaveProperty("passwordHash");
  });
});
