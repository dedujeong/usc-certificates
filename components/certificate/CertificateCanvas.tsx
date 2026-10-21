"use client";

import { Box, Paper, Skeleton, Typography, Divider } from "@mui/material";
import EditableFieldBox from "./EditableFieldBox";
import { CertificateField } from "@/lib/api/certificateFields";

interface CertificateCanvasProps {
  fields: CertificateField[];
  onEditField: (name: string) => void;
}

function fieldValue(fields: CertificateField[], name: string): string {
  return fields.find((f) => f.name === name)?.value ?? "";
}

function PeriodTableSkeleton({ label }: { label: string }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1, flex: 1, minWidth: 0 }}>
      <Skeleton variant="text" width="70%" height={14} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="text" width={`${90 - i * 8}%`} height={10} />
        ))}
      </Box>
    </Box>
  );
}

function SignatureSkeleton({ roleLabel }: { roleLabel: string }) {
  return (
    <Box sx={{ textAlign: "center", flex: 1 }}>
      <Skeleton variant="text" width="80%" height={10} sx={{ mx: "auto" }} />
      <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
      <Skeleton variant="text" width="60%" height={10} sx={{ mx: "auto" }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: 10 }}>
        {roleLabel} — se configura en Firmantes
      </Typography>
    </Box>
  );
}

function PageFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ pl: 0.5 }}>
        {label}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 2, sm: 3 },
          aspectRatio: "215.9 / 343",
          maxWidth: 560,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          overflow: "hidden",
          backgroundColor: "background.paper",
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}

/**
 * A simplified, non-pixel-exact visual simulation of the printed
 * certificate (see certificate/render/renderCertificate.ts for the real
 * layout), so staff can see roughly where each editable field prints
 * instead of editing a name/value table disconnected from the document.
 * Gray skeleton blocks stand in for static template text, tables and
 * signatures (not editable here); dashed boxes show the current value of
 * each CertificateField and open the edit dialog on click.
 */
export default function CertificateCanvas({ fields, onEditField }: CertificateCanvasProps) {
  const field = (name: string) => fieldValue(fields, name);

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 4, alignItems: "flex-start" }}>
      <PageFrame label="Página 1">
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Skeleton variant="circular" width={34} height={34} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="90%" height={10} />
            <Skeleton variant="text" width="75%" height={10} />
            <Skeleton variant="text" width="80%" height={10} />
          </Box>
          <EditableFieldBox label="SE-CL" value={field("SECL")} onClick={() => onEditField("SECL")} />
        </Box>

        {/* School info block */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rounded" width={50} height={64} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Skeleton variant="text" width="95%" height={10} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <EditableFieldBox label="Régimen" value={field("REGIMEN")} onClick={() => onEditField("REGIMEN")} />
              <EditableFieldBox label="Turno" value={field("TURNO")} onClick={() => onEditField("TURNO")} />
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <EditableFieldBox label="Clave" value={field("CLAVE")} onClick={() => onEditField("CLAVE")} />
              <EditableFieldBox label="Modalidad" value={field("MODALIDAD")} onClick={() => onEditField("MODALIDAD")} />
              <EditableFieldBox label="RVOE" value={field("RVOE")} onClick={() => onEditField("RVOE")} />
            </Box>
            <EditableFieldBox label="Vigente a partir del" value={field("VIGENCIA")} onClick={() => onEditField("VIGENCIA")} />
          </Box>
        </Box>

        {/* Certifica block — dynamic per student, not an editable field here */}
        <Box>
          <Skeleton variant="text" width="30%" height={14} />
          <Skeleton variant="text" width="98%" height={10} />
          <Skeleton variant="text" width="85%" height={10} />
        </Box>

        {/* Period tables 1–6 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          {[0, 1, 2].map((row) => (
            <Box key={row} sx={{ display: "flex", gap: 1, flex: 1 }}>
              <PeriodTableSkeleton label={`${row * 2 + 1}º cuatrimestre`} />
              <PeriodTableSkeleton label={`${row * 2 + 2}º cuatrimestre`} />
            </Box>
          ))}
        </Box>
        <Skeleton variant="text" width="90%" height={10} sx={{ mx: "auto" }} />
      </PageFrame>

      <PageFrame label="Página 2">
        <Box sx={{ display: "flex", gap: 1 }}>
          <PeriodTableSkeleton label="7º cuatrimestre" />
          <PeriodTableSkeleton label="8º/9º cuatrimestre (si aplica)" />
        </Box>

        <Skeleton variant="rounded" width="100%" height={18} />

        <Box sx={{ display: "flex", gap: 2 }}>
          <SignatureSkeleton roleLabel="Director general" />
          <SignatureSkeleton roleLabel="Director académico" />
        </Box>

        <EditableFieldBox
          label="Párrafo superior del certificado (LEGAL_TOP)"
          value={field("LEGAL_TOP")}
          onClick={() => onEditField("LEGAL_TOP")}
          variant="block"
        />

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Box sx={{ flex: 1, border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1 }}>
            <Skeleton variant="text" width="80%" height={10} />
            <Skeleton variant="text" width="60%" height={10} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="60%" height={10} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              Registro de servicios escolares
            </Typography>
          </Box>
          <Box sx={{ flex: 1.3, display: "flex", flexDirection: "column", gap: 1 }}>
            <EditableFieldBox label="Párrafo legal 1" value={field("LEGAL_1")} onClick={() => onEditField("LEGAL_1")} variant="block" />
            <EditableFieldBox label="Párrafo legal 2" value={field("LEGAL_2")} onClick={() => onEditField("LEGAL_2")} variant="block" />
          </Box>
        </Box>
      </PageFrame>
    </Box>
  );
}
