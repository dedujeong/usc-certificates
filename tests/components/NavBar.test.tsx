// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBar from "@/components/NavBar";

const mockLogout = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/students",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/auth/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

let mockUser: { id: number; email: string; role: "admin" | "superAdmin" } | null = null;

// Regression coverage for the role-based NavBar visibility rule from the
// E1 auth design: a plain "admin" must not see the Administradores link,
// while a "superAdmin" must. The corresponding API route re-validates the
// role server-side (defense in depth) — this only covers the UI layer.
describe("NavBar role-based visibility", () => {
  it("hides the Administradores link for a plain admin", () => {
    mockUser = { id: 1, email: "admin@test.dev", role: "admin" };
    render(<NavBar />);
    expect(screen.queryByText("ADMINISTRADORES")).not.toBeInTheDocument();
  });

  it("shows the Administradores link for a superAdmin", () => {
    mockUser = { id: 1, email: "super@test.dev", role: "superAdmin" };
    render(<NavBar />);
    expect(screen.getByText("ADMINISTRADORES")).toBeInTheDocument();
  });
});
