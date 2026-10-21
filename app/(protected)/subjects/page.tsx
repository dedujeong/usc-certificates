"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GridColDef } from "@mui/x-data-grid";
import { subjectsApi, Subject } from "@/lib/api/subjects";
import { careersApi } from "@/lib/api/careers";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import StatusChip from "@/components/StatusChip";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: queryKeys.subjects,
    queryFn: subjectsApi.list,
  });
  const { data: careers = [] } = useQuery({ queryKey: queryKeys.careers, queryFn: careersApi.list });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ careerId: "", name: "", period: "1" });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const [careerFilter, setCareerFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const filteredSubjects = subjects.filter(
    (s) =>
      (!careerFilter || s.careerId === Number(careerFilter)) && (!periodFilter || s.period === Number(periodFilter)),
  );

  function openCreate() {
    setEditing(null);
    setForm({ careerId: careers[0] ? String(careers[0].id) : "", name: "", period: "1" });
    setDialogOpen(true);
  }

  function openEdit(subject: Subject) {
    setEditing(subject);
    setForm({ careerId: String(subject.careerId), name: subject.name, period: String(subject.period) });
    setDialogOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      subjectsApi.create({ careerId: Number(form.careerId), name: form.name, period: Number(form.period) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      setAlert({ message: "Materia creada", severity: "success" });
      setDialogOpen(false);
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al crear", severity: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      subjectsApi.update(editing!.id, { name: form.name, period: Number(form.period) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      setAlert({ message: "Materia actualizada", severity: "success" });
      setDialogOpen(false);
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar", severity: "error" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? subjectsApi.update(id, { isActive: true }) : subjectsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      setAlert({ message: "Estado actualizado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar estado", severity: "error" }),
  });

  const columns: GridColDef<Subject>[] = [
    {
      field: "careerId",
      headerName: "Carrera",
      flex: 1,
      valueGetter: (_, row) => careers.find((c) => c.id === row.careerId)?.name ?? row.careerId,
    },
    { field: "name", headerName: "Materia", flex: 1.2 },
    { field: "period", headerName: "Periodo", width: 100, align: "center", headerAlign: "center" },
    {
      field: "isActive",
      headerName: "Estado",
      width: 130,
      renderCell: (p) => <StatusChip active={p.value} activeLabel="Activa" inactiveLabel="Inactiva" />,
    },
    {
      field: "actions",
      headerName: "",
      width: 220,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", width: "100%" }}>
          <Button size="small" variant="outlined" onClick={() => openEdit(params.row)}>
            Editar
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={params.row.isActive ? "error" : "success"}
            onClick={() => toggleActiveMutation.mutate({ id: params.row.id, isActive: !params.row.isActive })}
          >
            {params.row.isActive ? "Dar de baja" : "Reactivar"}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title="Materias"
        subtitle="Catálogo de materias por carrera y periodo"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={careers.length === 0}>
            Nueva materia
          </Button>
        }
      />

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="Carrera"
          value={careerFilter}
          onChange={(e) => setCareerFilter(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todas las carreras</MenuItem>
          {careers.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Periodo"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos los periodos</MenuItem>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((p) => (
            <MenuItem key={p} value={p}>
              {p}º cuatrimestre
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTableCard
        rows={filteredSubjects}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyLabel="No hay materias que coincidan con el filtro"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif' }}>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            select
            label="Carrera"
            value={form.careerId}
            onChange={(e) => setForm({ ...form, careerId: e.target.value })}
            disabled={!!editing}
          >
            {careers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField
            select
            label="Periodo"
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!form.name.trim() || !form.careerId}
            onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
