"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Extra guard for pages that require a specific role beyond "logged in"
 * (already enforced by app/(protected)/layout.tsx). Used by /administradores.
 * The corresponding API routes also re-validate the role server-side —
 * this is UI-level defense in depth, not the real authorization boundary.
 */
export default function RequireRole({ role, children }: { role: "admin" | "superAdmin"; children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== role) {
      router.replace("/");
    }
  }, [user, role, router]);

  if (!user || user.role !== role) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>No tienes permiso para ver esta página.</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
