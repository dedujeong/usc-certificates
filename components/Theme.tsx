"use client";

import { createContext } from "react";
import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2b7d34" },
    secondary: { main: "#F6BC00" },
    background: { default: "#DDDDDD", paper: "#ffffff" },
    error: { main: "#e1432e" },
    info: { main: "#4C86F9" },
    success: { main: "#49A84C" },
    text: { primary: "#202124", secondary: "#202124" },
  },
  shape: { borderRadius: 8 },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#66bb6a" },
    secondary: { main: "#ffca28" },
    background: { default: "#252525ff", paper: "#2a2a2a" },
    error: { main: "#f44336" },
    info: { main: "#2196f3" },
    success: { main: "#4caf50" },
    text: { primary: "#e0e0e0", secondary: "#b3b3b3" },
  },
  shape: { borderRadius: 8 },
});

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});
