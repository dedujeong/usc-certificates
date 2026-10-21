import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Resource already exists or conflicts with an active record") {
    super(409, message, "CONFLICT");
  }
}

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<unknown>;

function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

function errorResponse(status: number, message: string, code?: string, fields?: Record<string, string[]>) {
  return NextResponse.json({ error: { message, code, fields } }, { status });
}

/**
 * Wraps a Next.js Route Handler with uniform error handling and response shape.
 * Every handler returns either `{ data }` (success) or `{ error }` (failure),
 * replacing the old system's per-controller inconsistency (bare arrays vs
 * `{ scores }` wrappers, missing try/catch, `res.send(500).json(...)` bugs).
 */
export function handleRoute(handler: RouteHandler) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      const result = await handler(req, ctx);
      if (result instanceof NextResponse) return result;
      return ok(result);
    } catch (err) {
      if (err instanceof HttpError) {
        return errorResponse(err.status, err.message, err.code, err.fields);
      }
      if (err instanceof ZodError) {
        return errorResponse(400, "Validation failed", "VALIDATION_ERROR", err.flatten().fieldErrors as Record<string, string[]>);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return errorResponse(409, "A record with this value already exists", "UNIQUE_CONSTRAINT");
        }
        if (err.code === "P2025") {
          return errorResponse(404, "Resource not found", "NOT_FOUND");
        }
      }
      console.error(err);
      return errorResponse(500, "Internal server error", "INTERNAL_ERROR");
    }
  };
}
