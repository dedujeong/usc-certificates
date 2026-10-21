import { NextRequest } from "next/server";

type NextRequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>;

export function req(url: string, init: NextRequestInit = {}) {
  return new NextRequest(url, init);
}

/** For routes with no dynamic segments — handleRoute's signature still requires a ctx arg. */
export const noParams = { params: Promise.resolve({}) };
