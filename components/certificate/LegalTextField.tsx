"use client";

import { useRef, useState, useEffect, Fragment } from "react";
import { Box, Button, Menu, MenuItem, Paper, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import DataObjectIcon from "@mui/icons-material/DataObject";

export interface LegalTextPlaceholder {
  /** The literal token stored in the text, e.g. "{totalSubjects}". */
  token: string;
  /** Human label shown in the insert menu. */
  label: string;
  /** Example value shown in the live preview (the real value only exists at generation time). */
  example: string;
}

interface LegalTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholders?: LegalTextPlaceholder[];
}

/**
 * Editor for LEGAL_TOP/LEGAL_1/LEGAL_2: instead of asking staff to type the
 * raw `*bold*` / `_underline_` markup and `{placeholder}` tokens that
 * certificate/render/markup.ts and renderCertificate.ts expect, this gives
 * them Negrita/Subrayado toggle buttons that wrap the current selection,
 * and (for LEGAL_TOP) an "Insertar variable" menu that inserts the token
 * at the cursor — producing the exact same underlying string, just without
 * requiring staff to know the syntax.
 */
export default function LegalTextField({ value, onChange, placeholders }: LegalTextFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [pendingSelection, setPendingSelection] = useState<[number, number] | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (pendingSelection && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pendingSelection[0], pendingSelection[1]);
      setPendingSelection(null);
    }
  }, [pendingSelection]);

  function wrapSelection(marker: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
    onChange(next);
    setPendingSelection(
      selected ? [start + marker.length, end + marker.length] : [start + marker.length, start + marker.length],
    );
  }

  function insertAtCursor(token: string) {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? value.length;
    const next = `${value.slice(0, pos)}${token}${value.slice(pos)}`;
    onChange(next);
    setPendingSelection([pos + token.length, pos + token.length]);
    setMenuAnchor(null);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <ToggleButtonGroup size="small">
          <ToggleButton value="bold" onClick={() => wrapSelection("*")} title="Negrita">
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="underline" onClick={() => wrapSelection("_")} title="Subrayado">
            <FormatUnderlinedIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        {placeholders && placeholders.length > 0 && (
          <>
            <Button size="small" startIcon={<DataObjectIcon fontSize="small" />} onClick={(e) => setMenuAnchor(e.currentTarget)}>
              Insertar variable
            </Button>
            <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
              {placeholders.map((p) => (
                <MenuItem key={p.token} onClick={() => insertAtCursor(p.token)}>
                  {p.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>

      <Box
        component="textarea"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        sx={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "inherit",
          fontSize: 14,
          p: 1.5,
          borderRadius: "14px",
          border: "1px solid",
          borderColor: "divider",
          // Native <textarea> elements don't inherit `color` from ancestors
          // the way regular elements do — without this it fell back to the
          // browser's default form-control text color, which read as
          // white-on-white in light mode.
          color: "text.primary",
          backgroundColor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(28,27,23,0.02)"),
          resize: "vertical",
          "&:focus": { outline: "none", borderColor: "secondary.main" },
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        Selecciona texto y usa los botones para marcarlo en negrita o subrayado.
      </Typography>

      <Paper
        elevation={0}
        sx={{ mt: 1.5, p: 1.5, border: "1px solid", borderColor: "divider", backgroundColor: "background.default" }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Vista previa
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          <LegalTextPreview text={value} placeholders={placeholders} />
        </Typography>
      </Paper>
    </Box>
  );
}

// Renders the *bold* / _underline_ markup as actual styling, and replaces
// {placeholder} tokens with a bracketed example value — approximating what
// certificate/render/markup.ts (drawFormattedText) does when the real PDF
// is generated.
function LegalTextPreview({ text, placeholders }: { text: string; placeholders?: LegalTextPlaceholder[] }) {
  let resolved = text;
  for (const p of placeholders ?? []) {
    resolved = resolved.split(p.token).join(`[${p.example}]`);
  }

  const parts = resolved.split(/(\*.*?\*)|(_.*?_)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("*") && part.endsWith("*")) {
          return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith("_") && part.endsWith("_")) {
          return <u key={i}>{part.slice(1, -1)}</u>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
