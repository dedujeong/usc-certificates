import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as login } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { resetDb } from "../helpers/db";
import { noParams } from "../helpers/request";

function loginRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(resetDb);

  it("returns a token for valid credentials", async () => {
    await prisma.user.create({
      data: { email: "super@test.dev", passwordHash: hashPassword("correct-password"), role: "superAdmin" },
    });

    const res = await login(loginRequest({ email: "super@test.dev", password: "correct-password" }), noParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.token).toBeTypeOf("string");
    expect(body.data.user).toMatchObject({ email: "super@test.dev", role: "superAdmin" });
  });

  it("rejects an invalid password", async () => {
    await prisma.user.create({
      data: { email: "admin@test.dev", passwordHash: hashPassword("correct-password"), role: "admin" },
    });

    const res = await login(loginRequest({ email: "admin@test.dev", password: "wrong-password" }), noParams);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a login for an inactive user", async () => {
    await prisma.user.create({
      data: {
        email: "inactive@test.dev",
        passwordHash: hashPassword("correct-password"),
        role: "admin",
        isActive: false,
      },
    });

    const res = await login(loginRequest({ email: "inactive@test.dev", password: "correct-password" }), noParams);
    expect(res.status).toBe(401);
  });

  it("rejects malformed input with a validation error", async () => {
    const res = await login(loginRequest({ email: "not-an-email", password: "" }), noParams);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
