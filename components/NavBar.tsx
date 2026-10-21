"use client";

import { AppBar, Box, Button, Container, Toolbar, IconButton, useTheme } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContext } from "react";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";

import { ColorModeContext } from "./Theme";
import { useAuth } from "@/lib/auth/AuthContext";

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  requiresSuperAdmin?: boolean;
}

const pages: NavItem[] = [
  { title: "Registrar", path: "/registrar", icon: <PersonAddAltIcon fontSize="small" /> },
  { title: "Administrar", path: "/administrar", icon: <AppRegistrationIcon fontSize="small" /> },
  { title: "Administradores", path: "/administradores", icon: <AppRegistrationIcon fontSize="small" />, requiresSuperAdmin: true },
];

export default function NavBar() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const visiblePages = pages.filter((p) => !p.requiresSuperAdmin || user?.role === "superAdmin");

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Toolbar disableGutters sx={{ justifyContent: "space-between", py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/usc-logo-positive.svg" alt="Logo" width={36} height={36} />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(28,27,23,0.04)",
                borderRadius: 999,
                p: 0.5,
              }}
            >
              {visiblePages.map((page) => {
                const active = pathname?.startsWith(page.path);
                return (
                  <Button
                    component={Link}
                    href={page.path}
                    key={page.title}
                    disableElevation
                    sx={{
                      borderRadius: 999,
                      px: 2,
                      py: 0.75,
                      color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                      backgroundColor: active ? theme.palette.primary.main : "transparent",
                      "&:hover": {
                        backgroundColor: active ? theme.palette.primary.main : "rgba(28,27,23,0.06)",
                        opacity: active ? 0.92 : 1,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {page.icon}
                      {page.title}
                    </Box>
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton onClick={colorMode.toggleColorMode} sx={{ color: theme.palette.text.secondary }}>
              {theme.palette.mode === "dark" ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
            <IconButton onClick={handleLogout} title="Cerrar sesión" sx={{ color: theme.palette.text.secondary }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
