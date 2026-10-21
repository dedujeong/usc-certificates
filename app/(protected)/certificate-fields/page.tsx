"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GridColDef } from "@mui/x-data-grid";
import { certificateFieldsApi, CertificateField } from "@/lib/api/certificateFields";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";
import CertificateCanvas from "@/components/certificate/CertificateCanvas";
import LegalTextField, { LegalTextPlaceholder } from "@/components/certificate/LegalTextField";

const QUERY_KEY = ["certificate-fields"];

// Fields the certificate renderer actually reads (see
// certificate/render/renderCertificate.ts / certificateDataService.ts) —
// these are the ones shown on the simulated document canvas. Anything else
// an admin creates is a free-form field not used by the current template,
// listed separately below the canvas.
const KNOWN_FIELD_NAMES = new Set([
  "SCHOOL_NAME",
  "SCHOOL_CITY",
  "REGIMEN",
  "TURNO",
  "CLAVE",
  "MODALIDAD",
  "RVOE",
  "VIGENCIA",
  "SECL",
  "LEGAL_TOP",
  "LEGAL_1",
  "LEGAL_2",
]);

const FIELD_LABELS: Record<string, string> = {
  SCHOOL_NAME: "Nombre de la universidad",
  SCHOOL_CITY: "Ciudad",
  REGIMEN: "Régimen",
  TURNO: "Turno",
  CLAVE: "Clave",
  MODALIDAD: "Modalidad",
  RVOE: "RVOE (acuerdo número)",
  VIGENCIA: "Vigente a partir del",
  SECL: "Clave SE-CL",
  LEGAL_TOP: "Párrafo superior del certificado",
  LEGAL_1: "Párrafo legal 1",
  LEGAL_2: "Párrafo legal 2",
};

const MULTILINE_FIELDS = new Set(["LEGAL_TOP", "LEGAL_1", "LEGAL_2"]);
const DATE_FIELDS = new Set(["VIGENCIA"]);

// Only LEGAL_TOP supports {placeholder} substitution (see
// certificate/render/renderCertificate.ts's processedLegalTop); offered as
// an "insert variable" menu instead of asking staff to type the raw token.
const LEGAL_TOP_PLACEHOLDERS: LegalTextPlaceholder[] = [
  { token: "{totalSubjects}", label: "Número de materias (cifra)", example: "6" },
  { token: "{totalSubjectsText}", label: "Número de materias (texto)", example: "seis" },
  { token: "{dd}", label: "Día de expedición", example: "21" },
  { token: "{monthName}", label: "Mes de expedición", example: "octubre" },
  { token: "{yyyy}", label: "Año de expedición", example: "2026" },
];

export default function CertificateFieldsPage() {
  const queryClient = useQueryClient();
  const { data: fields = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: certificateFieldsApi.list });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateField | null>(null);
  const [form, setForm] = useState({ name: "", value: "" });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", value: "" });
    setDialogOpen(true);
  }

  function openEditByName(name: string) {
    const existing = fields.find((f) => f.name === name);
    if (existing) {
      setEditing(existing);
      setForm({ name: existing.name, value: existing.value });
    } else {
      // Known field not created yet (shouldn't happen after seeding, but
      // handle it gracefully instead of silently doing nothing).
      setEditing(null);
      setForm({ name, value: "" });
    }
    setDialogOpen(true);
  }

  function openEdit(f: CertificateField) {
    setEditing(f);
    setForm({ name: f.name, value: f.value });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? certificateFieldsApi.update(editing.id, form) : certificateFieldsApi.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAlert({ message: "Guardado", severity: "success" });
      setDialogOpen(false);
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al guardar", severity: "error" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => certificateFieldsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAlert({ message: "Eliminado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al eliminar", severity: "error" }),
  });

  const otherFields = fields.filter((f) => !KNOWN_FIELD_NAMES.has(f.name));

  const otherColumns: GridColDef<CertificateField>[] = [
    { field: "name", headerName: "Campo", width: 220 },
    { field: "value", headerName: "Valor", flex: 1 },
    {
      field: "actions",
      headerName: "",
      width: 180,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", width: "100%" }}>
          <Button size="small" variant="outlined" onClick={() => openEdit(params.row)}>
            Editar
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => removeMutation.mutate(params.row.id)}>
            Eliminar
          </Button>
        </Box>
      ),
    },
  ];

  const dialogLabel = editing ? FIELD_LABELS[editing.name] ?? editing.name : FIELD_LABELS[form.name] ?? "Nuevo campo";
  const isLegalText = MULTILINE_FIELDS.has(form.name);
  const isDate = DATE_FIELDS.has(form.name);

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title="Campos de certificado"
        subtitle="Simulación del documento — haz clic en cualquier recuadro punteado para editar ese texto"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo campo
          </Button>
        }
      />

      {isLoading ? (
        <Typography color="text.secondary">Cargando...</Typography>
      ) : (
        <CertificateCanvas fields={fields} onEditField={openEditByName} />
      )}

      {otherFields.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Otros campos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No se usan en la plantilla actual del certificado.
          </Typography>
          <DataTableCard rows={otherFields} columns={otherColumns} getRowId={(r) => r.id} hideSearch emptyLabel="" />
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif' }}>{dialogLabel}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Nombre del campo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!!editing || KNOWN_FIELD_NAMES.has(form.name)}
          />
          {isLegalText ? (
            <LegalTextField
              value={form.value}
              onChange={(value) => setForm({ ...form, value })}
              placeholders={form.name === "LEGAL_TOP" ? LEGAL_TOP_PLACEHOLDERS : undefined}
            />
          ) : (
            <TextField
              label="Valor"
              type={isDate ? "date" : "text"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              InputLabelProps={isDate ? { shrink: true } : undefined}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" disabled={!form.name.trim() || !form.value.trim()} onClick={() => saveMutation.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
