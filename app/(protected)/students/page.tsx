"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, IconButton, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GradeIcon from "@mui/icons-material/Grade";
import DescriptionIcon from "@mui/icons-material/Description";
import { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { studentsApi, Student } from "@/lib/api/students";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import StatusChip from "@/components/StatusChip";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: queryKeys.students,
    queryFn: studentsApi.list,
  });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? studentsApi.update(id, { isActive: true }) : studentsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      setAlert({ message: "Estado actualizado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar estado", severity: "error" }),
  });

  const columns: GridColDef<Student>[] = [
    { field: "tuition", headerName: "Matrícula", width: 110 },
    {
      field: "firstName",
      headerName: "Alumno",
      flex: 1.4,
      valueGetter: (_, row) => [row.firstName, row.paternalName, row.maternalName].filter(Boolean).join(" "),
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.firstName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {[params.row.paternalName, params.row.maternalName].filter(Boolean).join(" ")}
          </Typography>
        </Box>
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
      width: 220,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
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
        rows={students}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyLabel="No hay alumnos registrados todavía"
      />
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
