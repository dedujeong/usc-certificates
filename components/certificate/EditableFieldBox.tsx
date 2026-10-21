"use client";

import { Box, Typography, alpha } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

interface EditableFieldBoxProps {
  label: string;
  value: string;
  onClick: () => void;
  /** Layout hint: "inline" for short values (chip-like), "block" for long paragraphs. */
  variant?: "inline" | "block";
}

/**
 * A clickable box standing in for one editable CertificateField, placed
 * inside the simulated certificate layout (see CertificateCanvas). Shows
 * the field's current value so staff can see exactly what text will print
 * where, instead of a name/value row in a flat table disconnected from the
 * actual document.
 */
export default function EditableFieldBox({ label, value, onClick, variant = "inline" }: EditableFieldBoxProps) {
  const isEmpty = !value.trim();

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 0.25,
        cursor: "pointer",
        borderRadius: "3px",
        border: "1.5px dashed",
        borderColor: (t) => alpha(t.palette.secondary.main, 0.6),
        backgroundColor: (t) => alpha(t.palette.secondary.main, 0.08),
        px: 1.25,
        py: 0.5,
        width: variant === "block" ? "100%" : "auto",
        maxWidth: "100%",
        transition: "background-color 0.15s, border-color 0.15s",
        "&:hover": {
          backgroundColor: (t) => alpha(t.palette.secondary.main, 0.16),
          borderColor: "secondary.main",
        },
        "&:hover .edit-affordance": { opacity: 1 },
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: "secondary.main", textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: isEmpty ? "text.secondary" : "text.primary",
            fontStyle: isEmpty ? "italic" : "normal",
            whiteSpace: variant === "block" ? "pre-wrap" : "nowrap",
            overflow: variant === "inline" ? "hidden" : "visible",
            textOverflow: "ellipsis",
          }}
        >
          {isEmpty ? "Sin definir" : value}
        </Typography>
        <EditIcon className="edit-affordance" sx={{ fontSize: 14, opacity: 0, mt: 0.3, color: "secondary.main", flexShrink: 0 }} />
      </Box>
    </Box>
  );
}
