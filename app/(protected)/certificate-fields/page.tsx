"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GridColDef } from "@mui/x-data-grid";
import { certificateFieldsApi, CertificateField } from "@/lib/api/certificateFields";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";

const QUERY_KEY = ["certificate-fields"];

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

  function openEdit(field: CertificateField) {
    setEditing(field);
    setForm({ name: field.name, value: field.value });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editing ? certificateFieldsApi.update(editing.id, form) : certificateFieldsApi.create(form),
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

  const columns: GridColDef<CertificateField>[] = [
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

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title="Campos de certificado"
        subtitle="Textos de la plantilla del certificado (régimen, párrafos legales, etc.)"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo campo
          </Button>
        }
      />

      <DataTableCard
        rows={fields}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyLabel="No hay campos configurados todavía"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif' }}>{editing ? "Editar campo" : "Nuevo campo"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Nombre del campo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!!editing} />
          <TextField label="Valor" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} multiline minRows={2} />
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
