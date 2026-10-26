"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GradeIcon from "@mui/icons-material/Grade";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { studentsApi, Student } from "@/lib/api/students";
import { studentCareersApi } from "@/lib/api/studentCareers";
import { careersApi } from "@/lib/api/careers";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import StatusChip from "@/components/StatusChip";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";
import { FILTER_SELECT_SX } from "@/lib/ui/filterSelectSx";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: queryKeys.students,
    queryFn: studentsApi.list,
  });
  const { data: studentCareers = [] } = useQuery({
    queryKey: ["student-careers"],
    queryFn: studentCareersApi.list,
  });
  const { data: careers = [] } = useQuery({ queryKey: queryKeys.careers, queryFn: careersApi.list });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const [careerFilter, setCareerFilter] = useState("");
  const [editingTuition, setEditingTuition] = useState<Student | null>(null);
  const [tuitionInput, setTuitionInput] = useState("");

  const activeCareerByStudentId = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    for (const sc of studentCareers) {
      if (sc.isActive && sc.career) map.set(sc.studentId, { id: sc.career.id, name: sc.career.name });
    }
    return map;
  }, [studentCareers]);

  const filteredStudents = careerFilter
    ? students.filter((s) => activeCareerByStudentId.get(s.id)?.id === Number(careerFilter))
    : students;

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? studentsApi.update(id, { isActive: true }) : studentsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      setAlert({ message: "Estado actualizado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar estado", severity: "error" }),
  });

  function openEditTuition(student: Student) {
    setEditingTuition(student);
    setTuitionInput(String(student.tuition));
  }

  const newTuition = Number(tuitionInput);
  const tuitionValid = /^\d+$/.test(tuitionInput) && newTuition >= 1 && newTuition <= 2147483647;

  const tuitionMutation = useMutation({
    mutationFn: () => studentsApi.update(editingTuition!.id, { tuition: newTuition }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      setAlert({ message: `Matrícula actualizada a ${newTuition}`, severity: "success" });
      setEditingTuition(null);
    },
    onError: (err) =>
      setAlert({
        message:
          err instanceof ApiError && err.status === 409
            ? `La matrícula ${newTuition} ya está asignada a otro alumno`
            : err instanceof ApiError
              ? err.message
              : "Error al actualizar la matrícula",
        severity: "error",
      }),
  });

  const columns: GridColDef<Student>[] = [
    { field: "tuition", headerName: "Matrícula", width: 110 },
    {
      field: "firstName",
      headerName: "Alumno",
      flex: 1.4,
      valueGetter: (_, row) => [row.firstName, row.paternalName, row.maternalName].filter(Boolean).join(" "),
      renderCell: (params) => (
        <Box sx={{ overflow: "hidden", minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {params.row.firstName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.3 }}>
            {[params.row.paternalName, params.row.maternalName].filter(Boolean).join(" ")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "career",
      headerName: "Carrera",
      flex: 1.2,
      valueGetter: (_, row) => activeCareerByStudentId.get(row.id)?.name ?? "",
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? "text.primary" : "text.secondary"}>
          {params.value || "Sin inscripción"}
        </Typography>
      ),
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 130,
      renderCell: (p) => <StatusChip active={p.value} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 260,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
          <Tooltip title="Editar matrícula">
            <IconButton size="small" onClick={() => openEditTuition(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Calificaciones">
            <IconButton size="small" component={Link} href={`/students/${params.row.id}/scores`}>
              <GradeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generar certificado">
            <IconButton size="small" component={Link} href={`/students/${params.row.id}/certificate`}>
              <DescriptionIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            color={params.row.isActive ? "error" : "success"}
            onClick={() => toggleActiveMutation.mutate({ id: params.row.id, isActive: !params.row.isActive })}
          >
            {params.row.isActive ? "Baja" : "Reactivar"}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title="Alumnos"
        subtitle="Consulta, edita y genera certificados de los alumnos registrados"
        action={
          <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/students/new">
            Nuevo alumno
          </Button>
        }
      />

      <DataTableCard
        rows={filteredStudents}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyLabel="No hay alumnos que coincidan con el filtro"
        filters={
          <TextField
            select
            size="small"
            label="Carrera"
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            sx={FILTER_SELECT_SX(220)}
          >
            <MenuItem value="">Todas las carreras</MenuItem>
            {careers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        }
      />
      <Dialog open={!!editingTuition} onClose={() => setEditingTuition(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif' }}>Editar matrícula</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {editingTuition && (
            <Typography variant="body2" color="text.secondary">
              {[editingTuition.firstName, editingTuition.paternalName, editingTuition.maternalName].filter(Boolean).join(" ")} —
              matrícula actual {editingTuition.tuition}. Sus calificaciones e inscripciones se conservan; los certificados
              que se generen a partir de ahora mostrarán la nueva matrícula.
            </Typography>
          )}
          <TextField
            label="Nueva matrícula"
            value={tuitionInput}
            onChange={(e) => setTuitionInput(e.target.value.trim())}
            error={tuitionInput !== "" && !tuitionValid}
            helperText={tuitionInput !== "" && !tuitionValid ? "Solo números enteros positivos" : " "}
            inputProps={{ inputMode: "numeric" }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditingTuition(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!tuitionValid || newTuition === editingTuition?.tuition || tuitionMutation.isPending}
            onClick={() => tuitionMutation.mutate()}
          >
            {tuitionMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
