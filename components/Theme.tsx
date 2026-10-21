"use client";

import { createContext } from "react";
import { createTheme, ThemeOptions, alpha } from "@mui/material/styles";
// Augments MUI's Components<Theme> type with the MuiDataGrid key so the
// theme.components.MuiDataGrid override below type-checks.
import type {} from "@mui/x-data-grid/themeAugmentation";

// Design direction: warm cream/near-black minimal admin UI (pill buttons,
// soft shadows, serif display headings), inspired by neutral component
// design systems rather than a colorful marketing dashboard — this is a
// tool staff use all day for certificates/grades, so legibility and a calm
// palette matter more than visual flourish. Status/role information still
// gets color via pill Chips (see components/StatusChip.tsx).

const fontSerif = '"Fraunces", "Georgia", serif';
const fontSans = '"Roboto", "Helvetica", "Arial", sans-serif';

const lightPalette = {
  mode: "light" as const,
  primary: { main: "#1C1B17", contrastText: "#FAF6EE" },
  secondary: { main: "#C98A3E", contrastText: "#1C1B17" },
  background: { default: "#F6F1E7", paper: "#FFFFFF" },
  error: { main: "#B5533D" },
  warning: { main: "#C98A3E" },
  info: { main: "#5A7A91" },
  success: { main: "#5E8C5A" },
  text: { primary: "#1C1B17", secondary: "#746E60" },
  divider: "#E7DFCE",
};

const darkPalette = {
  mode: "dark" as const,
  primary: { main: "#F3EDDC", contrastText: "#1C1B17" },
  secondary: { main: "#D9A157", contrastText: "#1C1B17" },
  background: { default: "#17160F", paper: "#221F18" },
  error: { main: "#D97A62" },
  warning: { main: "#D9A157" },
  info: { main: "#7FA3BC" },
  success: { main: "#80B87B" },
  text: { primary: "#F3EDDC", secondary: "#B6AE9B" },
  divider: "#342F23",
};

function buildTheme(palette: typeof lightPalette | typeof darkPalette): ThemeOptions {
  const isDark = palette.mode === "dark";

  return {
    palette,
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: fontSans,
      h1: { fontFamily: fontSerif, fontWeight: 600, letterSpacing: "-0.01em" },
      h2: { fontFamily: fontSerif, fontWeight: 600, letterSpacing: "-0.01em" },
      h3: { fontFamily: fontSerif, fontWeight: 600 },
      h4: { fontFamily: fontSerif, fontWeight: 600 },
      h5: { fontFamily: fontSerif, fontWeight: 600 },
      h6: { fontFamily: fontSerif, fontWeight: 600 },
      button: { fontFamily: fontSans, fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: palette.background.default },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 20,
            paddingBlock: 8,
            boxShadow: "none",
          },
          contained: {
            boxShadow: "none",
            "&:hover": { boxShadow: "none", opacity: 0.9 },
          },
          outlined: {
            borderColor: palette.divider,
            "&:hover": { borderColor: palette.text.secondary, backgroundColor: alpha(palette.text.primary, 0.04) },
          },
          sizeSmall: { paddingInline: 14, paddingBlock: 5 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 999 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 20,
          },
          outlined: { borderColor: palette.divider },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${palette.divider}`,
            boxShadow: isDark ? "none" : "0 1px 2px rgba(28,27,23,0.04)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            color: palette.text.primary,
            boxShadow: "none",
            borderBottom: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 600 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#1C1B17", 0.02),
          },
          notchedOutline: { borderColor: palette.divider },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 24 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: palette.divider },
          head: { fontWeight: 700, color: palette.text.secondary },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: "none",
            borderRadius: 20,
            backgroundColor: palette.background.paper,
            "--DataGrid-containerBackground": palette.background.paper,
          },
          columnHeaders: {
            borderBottom: `1px solid ${palette.divider}`,
            backgroundColor: "transparent",
          },
          columnHeaderTitle: { fontWeight: 700, color: palette.text.secondary },
          cell: { borderColor: palette.divider, "&:focus, &:focus-within": { outline: "none" } },
          row: {
            "&:hover": { backgroundColor: isDark ? alpha("#FFFFFF", 0.04) : alpha("#1C1B17", 0.03) },
          },
          footerContainer: { borderTop: `1px solid ${palette.divider}` },
        },
      },
    },
  };
}

export const lightTheme = createTheme(buildTheme(lightPalette));
export const darkTheme = createTheme(buildTheme(darkPalette));

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});
