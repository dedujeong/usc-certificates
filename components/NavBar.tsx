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
  { title: "REGISTRAR", path: "/registrar", icon: <PersonAddAltIcon /> },
  { title: "ADMINISTRAR", path: "/administrar", icon: <AppRegistrationIcon /> },
  { title: "ADMINISTRADORES", path: "/administradores", icon: <AppRegistrationIcon />, requiresSuperAdmin: true },
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
    <AppBar position="sticky" sx={{ borderRadius: 2 }}>
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/usc-logo-negative.svg" alt="Logo" width={50} height={50} />
            </Box>
            <Box sx={{ display: "flex" }}>
              {visiblePages.map((page) => (
                <Button
                  component={Link}
                  href={page.path}
                  key={page.title}
                  sx={{
                    m: 1,
                    color: "white",
                    display: "block",
                    fontWeight: pathname?.startsWith(page.path) ? 700 : 400,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {page.icon}
                    {page.title}
                  </Box>
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton sx={{ ml: 1 }} onClick={handleLogout} color="inherit" title="Cerrar sesión">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
