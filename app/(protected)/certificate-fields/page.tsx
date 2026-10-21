"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { certificateFieldsApi, CertificateField } from "@/lib/api/certificateFields";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";

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
      headerName: "Acciones",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" onClick={() => openEdit(params.row)}>
            Editar
          </Button>
          <Button size="small" color="error" onClick={() => removeMutation.mutate(params.row.id)}>
            Eliminar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Campos de certificado</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo campo
        </Button>
      </Box>
      <DataGrid rows={fields} columns={columns} loading={isLoading} autoHeight disableRowSelectionOnClick getRowId={(r) => r.id} />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Editar campo" : "Nuevo campo"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Nombre del campo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!!editing} />
          <TextField label="Valor" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!form.name.trim() || !form.value.trim()} onClick={() => saveMutation.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
