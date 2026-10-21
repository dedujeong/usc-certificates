"use client";

import { Box, Typography, alpha } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

interface EditableFieldBoxProps {
  label: string;
  value: string;
  onClick: () => void;
  /** Layout hint: "inline" for short values (chip-like), "block" for long paragraphs. */
  variant?: "inline" | "block";
  /** Minimum height, e.g. to make two "block" boxes read as the same size. */
  minHeight?: number;
  /** Caps "block" text to this many lines (ellipsis beyond that) so a long
   *  real paragraph can't blow out the simulated layout's fixed grid —
   *  the full text is always visible in the edit dialog on click. */
  maxLines?: number;
}

// Shared with CertificateCanvas's skeleton blocks so every box in the mock
// (editable or not) reads as part of the same document, not two styles.
export const MOCK_BORDER_RADIUS = "3px";

/**
 * A clickable box standing in for one editable CertificateField, placed
 * inside the simulated certificate layout (see CertificateCanvas). Shows
 * the field's current value so staff can see exactly what text will print
 * where, instead of a name/value row in a flat table disconnected from the
 * actual document.
 */
export default function EditableFieldBox({
  label,
  value,
  onClick,
  variant = "inline",
  minHeight,
  maxLines = 4,
}: EditableFieldBoxProps) {
  const isEmpty = !value.trim();

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 0.25,
        cursor: "pointer",
        borderRadius: MOCK_BORDER_RADIUS,
        border: "1px solid",
        borderColor: (t) => alpha(t.palette.secondary.main, 0.6),
        backgroundColor: (t) => alpha(t.palette.secondary.main, 0.08),
        px: 1,
        py: 0.4,
        width: variant === "block" ? "100%" : "auto",
        maxWidth: "100%",
        minHeight,
        boxSizing: "border-box",
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
        sx={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, color: "secondary.main", textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <Typography
          sx={
            variant === "block"
              ? {
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: isEmpty ? "text.secondary" : "text.primary",
                  fontStyle: isEmpty ? "italic" : "normal",
                  whiteSpace: "pre-wrap",
                  display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
              : {
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: isEmpty ? "text.secondary" : "text.primary",
                  fontStyle: isEmpty ? "italic" : "normal",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }
          }
        >
          {isEmpty ? "Sin definir" : value}
        </Typography>
        <EditIcon className="edit-affordance" sx={{ fontSize: 12, opacity: 0, mt: 0.2, color: "secondary.main", flexShrink: 0 }} />
      </Box>
    </Box>
  );
}
