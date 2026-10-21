"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GridColDef } from "@mui/x-data-grid";
import { peopleApi, Person } from "@/lib/api/people";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";

const QUERY_KEY = ["people"];

export default function PeoplePage() {
  const queryClient = useQueryClient();
  const { data: people = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: peopleApi.list });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({ prefix: "", name: "", charge: "", gender: "male" as "male" | "female" });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ prefix: "", name: "", charge: "", gender: "male" });
    setDialogOpen(true);
  }

  function openEdit(person: Person) {
    setEditing(person);
    setForm({ prefix: person.prefix ?? "", name: person.name, charge: person.charge, gender: person.gender });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? peopleApi.update(editing.id, form) : peopleApi.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAlert({ message: "Guardado", severity: "success" });
      setDialogOpen(false);
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al guardar", severity: "error" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => peopleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setAlert({ message: "Eliminado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al eliminar", severity: "error" }),
  });

  const columns: GridColDef<Person>[] = [
    { field: "prefix", headerName: "Prefijo", width: 100 },
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "charge", headerName: "Cargo", flex: 1 },
    {
      field: "gender",
      headerName: "Género",
      width: 120,
      valueGetter: (value) => (value === "male" ? "Masculino" : "Femenino"),
    },
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
        title="Firmantes del certificado"
        subtitle="Personas que aparecen firmando en el certificado (director, secretario, etc.)"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo firmante
          </Button>
        }
      />
      <DataTableCard
        rows={people}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyLabel="No hay firmantes registrados todavía"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif' }}>{editing ? "Editar firmante" : "Nuevo firmante"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Prefijo (Lic., Dr., etc.)" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} />
          <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Cargo" value={form.charge} onChange={(e) => setForm({ ...form, charge: e.target.value })} />
          <TextField select label="Género" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })}>
            <MenuItem value="male">Masculino</MenuItem>
            <MenuItem value="female">Femenino</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" disabled={!form.name.trim() || !form.charge.trim()} onClick={() => saveMutation.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
