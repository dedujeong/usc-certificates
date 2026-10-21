"use client";

import { Box, Paper, Skeleton, Typography, Divider } from "@mui/material";
import EditableFieldBox, { MOCK_BORDER_RADIUS } from "./EditableFieldBox";
import { CertificateField } from "@/lib/api/certificateFields";

interface CertificateCanvasProps {
  fields: CertificateField[];
  onEditField: (name: string) => void;
}

const PAGE_WIDTH = 480;
const PAGE_HEIGHT = Math.round((PAGE_WIDTH * 343) / 215.9); // same physical page ratio as the real certificate (215.9mm × 343mm), both pages equal height

function fieldValue(fields: CertificateField[], name: string): string {
  return fields.find((f) => f.name === name)?.value ?? "";
}

function PeriodTableSkeleton({ label }: { label: string }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: MOCK_BORDER_RADIUS, p: 1, flex: 1, minWidth: 0 }}>
      <Skeleton variant="text" width="70%" height={14} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="text" width={`${90 - i * 8}%`} height={10} />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9, display: "block", mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

function SignatureSkeleton({ roleLabel }: { roleLabel: string }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Skeleton variant="text" width="85%" height={9} sx={{ mx: "auto" }} />
      <Divider sx={{ my: 2.25 }} />
      <Skeleton variant="text" width="65%" height={9} sx={{ mx: "auto" }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: 9 }}>
        {roleLabel} — en Firmantes
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
          borderRadius: MOCK_BORDER_RADIUS,
          p: { xs: 1.75, sm: 2.25 },
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          overflow: "hidden",
          backgroundColor: "background.paper",
          fontSize: 11,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}

/**
 * A simplified visual simulation of the printed certificate (see
 * certificate/render/renderCertificate.ts for the real layout), so staff
 * see roughly where each editable field prints instead of editing a
 * name/value table disconnected from the document. Gray skeleton blocks
 * stand in for static template text, tables and signatures (not editable
 * here); dashed boxes show the current value of each CertificateField and
 * open the edit dialog on click. Page 2 mirrors the real document's
 * two-column layout (left: average/primary signatures, right: legal
 * paragraphs/secondary signatures).
 */
export default function CertificateCanvas({ fields, onEditField }: CertificateCanvasProps) {
  const field = (name: string) => fieldValue(fields, name);

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 4, alignItems: "flex-start" }}>
      <PageFrame label="Página 1">
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="90%" height={9} />
            <Skeleton variant="text" width="75%" height={9} />
            <Skeleton variant="text" width="80%" height={9} />
          </Box>
          <EditableFieldBox label="SE-CL" value={field("SECL")} onClick={() => onEditField("SECL")} />
        </Box>

        {/* School name / address block */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rounded" width={46} height={60} sx={{ flexShrink: 0, borderRadius: MOCK_BORDER_RADIUS }} />
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                LA UNIVERSIDAD
              </Typography>
              <EditableFieldBox label="Nombre" value={field("SCHOOL_NAME")} onClick={() => onEditField("SCHOOL_NAME")} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                UBICADO EN LA CIUDAD DE
              </Typography>
            </Box>
            <EditableFieldBox label="Ciudad" value={field("SCHOOL_CITY")} onClick={() => onEditField("SCHOOL_CITY")} />
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
          <Skeleton variant="text" width="30%" height={13} />
          <Skeleton variant="text" width="98%" height={9} />
          <Skeleton variant="text" width="85%" height={9} />
        </Box>

        {/* Period tables 1–6 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minHeight: 0 }}>
          {[0, 1, 2].map((row) => (
            <Box key={row} sx={{ display: "flex", gap: 1, flex: 1 }}>
              <PeriodTableSkeleton label={`${row * 2 + 1}º cuatrimestre`} />
              <PeriodTableSkeleton label={`${row * 2 + 2}º cuatrimestre`} />
            </Box>
          ))}
        </Box>
        <Skeleton variant="text" width="90%" height={9} sx={{ mx: "auto" }} />
      </PageFrame>

      <PageFrame label="Página 2">
        {/* A real 2-column grid (not two independently-flowing flex
            columns) so each row's height is the max of both cells —
            that's what keeps the two signature rows aligned regardless of
            how tall LEGAL_TOP/LEGAL_1/LEGAL_2 happen to be. Gap matches
            the Página 1 table grid (gap: 1) instead of the looser spacing
            this used to have. */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, alignContent: "start" }}>
          <PeriodTableSkeleton label="7º cuatrimestre" />
          <PeriodTableSkeleton label="8º cuatrimestre" />

          {/* 9º cuatrimestre only applies to careers whose catalog reaches
              a 9th period (see hasNinthPeriod in renderCertificate.ts) —
              stacked under 8º on the right, same column, so the mock
              reflects the most space-constrained real case. */}
          <Box />
          <PeriodTableSkeleton label="9º cuatrimestre (si aplica)" />

          {/* Promedio general sits to the left of LEGAL_TOP, top-aligned
              with it (alignSelf: "start") rather than stretched to match
              its height. */}
          <Box
            sx={{
              alignSelf: "start",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: MOCK_BORDER_RADIUS,
              px: 1,
              py: 0.5,
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 9, fontWeight: 700 }}>
              PROMEDIO GENERAL:
            </Typography>
            <Skeleton variant="text" width="50%" height={9} />
          </Box>
          <EditableFieldBox
            label="Párrafo superior del certificado"
            value={field("LEGAL_TOP")}
            onClick={() => onEditField("LEGAL_TOP")}
            variant="block"
          />

          <SignatureSkeleton roleLabel="Director general" />
          <SignatureSkeleton roleLabel="Director académico" />

          <SignatureSkeleton roleLabel="Representante legal" />
          <SignatureSkeleton roleLabel="Secretario de educación" />

          {/* Spans the same 3 rows as Párrafo legal 1, Párrafo legal 2 and
              the Subsecretario signature below — a grid item stretches to
              fill its full row-span height by default, so this box's
              bottom edge lands exactly at the Subsecretario signature
              line without manual height math. */}
          <Box
            sx={{
              gridRow: "span 3",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: MOCK_BORDER_RADIUS,
              p: 1,
            }}
          >
            <Skeleton variant="text" width="90%" height={9} />
            <Skeleton variant="text" width="70%" height={9} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9, display: "block", mt: 1 }}>
              Registro de servicios escolares
            </Typography>
          </Box>
          <EditableFieldBox
            label="Párrafo legal 1"
            value={field("LEGAL_1")}
            onClick={() => onEditField("LEGAL_1")}
            variant="block"
            minHeight={84}
          />

          <EditableFieldBox
            label="Párrafo legal 2"
            value={field("LEGAL_2")}
            onClick={() => onEditField("LEGAL_2")}
            variant="block"
            minHeight={84}
          />

          <SignatureSkeleton roleLabel="Subsecretario" />
        </Box>
      </PageFrame>
    </Box>
  );
}
