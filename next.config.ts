import type { NextConfig } from "next";

// Cache Components (Next.js 16's static/dynamic boundary validation) is
// disabled: this app is fully dynamic/client-rendered behind auth (every
// protected page fetches its data client-side via TanStack Query after the
// CSR auth guard resolves), so there is no static-shell benefit to gain
// from it, and it was flagging the auth guard's loading-state branch as an
// unvalidated "instant navigation" segment.
const nextConfig: NextConfig = {};

export default nextConfig;
