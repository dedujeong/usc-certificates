"use client";

import { Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface StatusChipProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusChip({ active, activeLabel = "Activo", inactiveLabel = "Inactivo" }: StatusChipProps) {
  const theme = useTheme();
  const color = active ? theme.palette.success.main : theme.palette.text.secondary;

  return (
    <Chip
      size="small"
      label={active ? activeLabel : inactiveLabel}
      sx={{
        backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.12),
        color,
        border: "none",
      }}
    />
  );
}
